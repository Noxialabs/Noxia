import OpenAI from "openai";
import { query } from "../database/connection";
import { AIClassification, EscalationAnalysis } from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async classifyText(text: string, context?: any): Promise<AIClassification> {
    const prompt = `
You are an AI legal triage assistant for a crime reporting platform that combats systematic corruption.

This platform is specifically designed to help victims of:
- Police misconduct and corruption
- Government corruption and abuse of power
- Judicial misconduct
- State violence and illegal imprisonment
- Systematic oppression and cover-ups

Analyze the following case description and provide classification:

1. Issue Category: Choose the most appropriate category:
   - Corruption - Police (police taking bribes, refusing to investigate, abuse of power)
   - Corruption - Government (officials taking bribes, misuse of public funds, cover-ups)
   - Corruption - Judicial (judges taking bribes, unfair trials, judicial bias)
   - Criminal - Assault (physical violence, battery, threats)
   - Criminal - Fraud (financial fraud, scams, embezzlement)
   - Criminal - Harassment (stalking, intimidation, threats)
   - Criminal - Murder (suspicious deaths, state killings, cover-ups)
   - Legal - Civil Rights (discrimination, violation of basic rights)
   - Legal - Employment (workplace violations, wrongful termination)
   - Legal - Housing (evictions, housing discrimination)
   - Legal - Immigration (visa issues, deportation, asylum)
   - Other

2. Escalation Level:
   - Basic: Standard processing, no immediate danger
   - Priority: Requires attention within 24-48 hours, potential ongoing harm
   - Urgent: Immediate action required, life-threatening, active persecution

3. Confidence: 0.0 to 1.0 (how confident you are in the classification)

4. Suggested Actions: List 2-4 immediate actions that should be taken

5. Urgency Score: 1-10 (1 = low urgency, 10 = life-threatening/critical)

IMPORTANT: Given this platform's mission to combat systematic corruption and state violence, be especially sensitive to:
- Cases involving police refusing to investigate crimes
- Government officials covering up wrongdoing
- Judicial bias or corruption
- Threats or retaliation against whistleblowers
- Patterns of systematic abuse
- Cases where victims have been imprisoned without trial

Return ONLY a JSON object in this exact format:
{
  "issueCategory": "...",
  "escalationLevel": "...",
  "confidence": 0.0,
  "suggestedActions": ["...", "...", "..."],
  "urgencyScore": 0
}

Case Description:
"""${text}"""

${context ? `Additional Context: ${JSON.stringify(context)}` : ""}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.2"),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
      });

      console.log("Response: ", response);
      const rawResponse = response.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error("No response from OpenAI");
      }

      const classification = this.parseOpenAIResponse(rawResponse);
      // Validate response structure
      if (
        !classification.issueCategory ||
        !classification.escalationLevel ||
        typeof classification.confidence !== "number"
      ) {
        throw new Error("Invalid classification response structure");
      }

      // Ensure arrays are arrays
      if (!Array.isArray(classification.suggestedActions)) {
        classification.suggestedActions = ["Manual review required"];
      }

      return classification;
    } catch (error) {
      logger.error("OpenAI classification error:", error);

      // Return fallback classification with appropriate defaults for the platform
      return {
        issueCategory: "Other",
        escalationLevel: "Priority", // Default to Priority for safety
        confidence: 0.1,
        suggestedActions: [
          "Manual review required due to AI classification failure",
          "Contact support team immediately",
          "Document all evidence carefully",
        ],
        urgencyScore: 6, // Higher default due to platform's critical nature
      };
    }
  }

  async logClassification(logData: {
    inputText: string;
    caseId?: string;
    issueCategory: string;
    escalationLevel: string;
    confidence: number;
    urgencyScore: number;
    suggestedActions: string[];
    processingTimeMs: number;
    userId?: string;
  }): Promise<void> {
    const id = uuidv4();

    await query(
      `INSERT INTO ai_classifications (
        id, case_id, input_text, issue_category, escalation_level,
        confidence, urgency_score, suggested_actions, processing_time_ms,
        model_used, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        logData.caseId || null,
        logData.inputText,
        logData.issueCategory,
        logData.escalationLevel,
        logData.confidence,
        logData.urgencyScore,
        JSON.stringify(logData.suggestedActions),
        logData.processingTimeMs,
        process.env.OPENAI_MODEL || "gpt-4",
        new Date(),
      ]
    );

    logger.info(`AI classification logged: ${logData.issueCategory}`);
  }

  async updateCaseClassification(
    caseId: string,
    classification: AIClassification
  ): Promise<any> {
    const result = await query(
      `UPDATE cases 
       SET issue_category = $1, escalation_level = $2, ai_confidence = $3,
           urgency_score = $4, suggested_actions = $5, updated_at = $6
       WHERE id = $7 
       RETURNING *`,
      [
        classification.issueCategory,
        classification.escalationLevel,
        classification.confidence,
        classification.urgencyScore,
        JSON.stringify(classification.suggestedActions),
        new Date(),
        caseId,
      ]
    );

    return result.rows[0];
  }

  async getClassificationHistory(
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ classifications: any[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "";
    const values: any[] = [];

    if (userId) {
      whereClause = `
        WHERE ai_classifications.case_id IN (
          SELECT id FROM cases WHERE user_id = $1
        )
      `;
      values.push(userId);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM ai_classifications ${whereClause}`,
      values
    );

    const classificationsResult = await query(
      `SELECT ai_classifications.*, cases.case_ref 
       FROM ai_classifications 
       LEFT JOIN cases ON ai_classifications.case_id = cases.id
       ${whereClause}
       ORDER BY ai_classifications.created_at DESC 
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return {
      classifications: classificationsResult.rows.map((row) => ({
        id: row.id,
        caseId: row.case_id,
        caseRef: row.case_ref,
        inputText: row.input_text?.substring(0, 200) + "...", // Truncate for privacy
        issueCategory: row.issue_category,
        escalationLevel: row.escalation_level,
        confidence: parseFloat(row.confidence),
        urgencyScore: row.urgency_score,
        suggestedActions: JSON.parse(row.suggested_actions || "[]"),
        processingTimeMs: row.processing_time_ms,
        modelUsed: row.model_used,
        createdAt: row.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
    };
  }

  async getClassificationStats(
    userId?: string,
    timeframe: string = "30d"
  ): Promise<any> {
    let whereClause = "";
    const values: any[] = [];

    if (userId) {
      whereClause = `
        WHERE ai_classifications.case_id IN (
          SELECT id FROM cases WHERE user_id = $1
        )
      `;
      values.push(userId);
    }

    // Add timeframe filter
    const timeframeMap = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "1y": "1 year",
    };

    if (whereClause) {
      whereClause += ` AND ai_classifications.created_at > NOW() - INTERVAL '${
        timeframeMap[timeframe as keyof typeof timeframeMap] || "30 days"
      }'`;
    } else {
      whereClause = `WHERE ai_classifications.created_at > NOW() - INTERVAL '${
        timeframeMap[timeframe as keyof typeof timeframeMap] || "30 days"
      }'`;
    }

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_classifications,
        AVG(confidence) as avg_confidence,
        AVG(urgency_score) as avg_urgency_score,
        AVG(processing_time_ms) as avg_processing_time,
        COUNT(CASE WHEN escalation_level = 'Urgent' THEN 1 END) as urgent_cases,
        COUNT(CASE WHEN escalation_level = 'Priority' THEN 1 END) as priority_cases,
        COUNT(CASE WHEN escalation_level = 'Basic' THEN 1 END) as basic_cases,
        issue_category,
        COUNT(*) as category_count
      FROM ai_classifications 
      ${whereClause}
      GROUP BY issue_category
      ORDER BY category_count DESC
    `,
      values
    );

    return {
      totalClassifications: result.rows[0]?.total_classifications || 0,
      avgConfidence: parseFloat(result.rows[0]?.avg_confidence || "0"),
      avgUrgencyScore: parseFloat(result.rows[0]?.avg_urgency_score || "0"),
      avgProcessingTime: parseFloat(result.rows[0]?.avg_processing_time || "0"),
      urgentCases: parseInt(result.rows[0]?.urgent_cases || "0"),
      priorityCases: parseInt(result.rows[0]?.priority_cases || "0"),
      basicCases: parseInt(result.rows[0]?.basic_cases || "0"),
      categoryBreakdown: result.rows.map((row) => ({
        category: row.issue_category,
        count: parseInt(row.category_count),
      })),
    };
  }

  async generateCaseSummary(caseId: string, userId: string): Promise<string> {
    // Get case details
    const caseResult = await query(
      "SELECT * FROM cases WHERE id = $1 AND user_id = $2",
      [caseId, userId]
    );

    if (caseResult.rows.length === 0) {
      throw new Error("Case not found");
    }

    const caseData = caseResult.rows[0];

    const prompt = `
Generate a professional case summary for the following crime report:

Case Reference: ${caseData.case_ref}
Client: ${caseData.client_name}
Issue Category: ${caseData.issue_category}
Escalation Level: ${caseData.escalation_level}
Description: ${caseData.description}
Jurisdiction: ${caseData.jurisdiction || "Not specified"}

Create a concise, professional summary (max 200 words) that:
1. Summarizes the key facts
2. Identifies the main legal issues
3. Notes the urgency level
4. Suggests next steps

Format as plain text, professional tone.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      return (
        response.choices[0]?.message?.content || "Summary generation failed"
      );
    } catch (error) {
      logger.error("Case summary generation error:", error);
      return `Case Summary: ${caseData.case_ref} - ${caseData.issue_category} case requiring ${caseData.escalation_level} attention. Manual summary required due to AI processing error.`;
    }
  }

  async analyzeEscalation(caseData: {
    title: string;
    description: string;
    currentPriority: string;
    currentStatus: string;
    issueCategory: string;
    jurisdiction?: string;
    submissionDate: Date;
    userReason?: string; // Manual escalation reason from user
  }): Promise<EscalationAnalysis> {
    try {
      const daysSinceSubmission = Math.floor(
        (new Date().getTime() - caseData.submissionDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const prompt = `
        Analyze the following legal case for escalation necessity:

        Case Details:
        - Title: ${caseData.title}
        - Description: ${caseData.description}
        - Current Priority: ${caseData.currentPriority}
        - Current Status: ${caseData.currentStatus}
        - Issue Category: ${caseData.issueCategory}
        - Jurisdiction: ${caseData.jurisdiction || "Not specified"}
        - Days since submission: ${daysSinceSubmission}
        ${
          caseData.userReason
            ? `- Manual escalation reason: ${caseData.userReason}`
            : ""
        }

        Analyze this case and determine:
        1. Should this case be escalated? (true/false)
        2. Confidence level (0-1)
        3. Specific reasons for escalation
        4. Suggested priority level (Normal/High/Critical)
        5. Urgency score (1-10)
        6. Risk factors identified
        7. Overall recommendation

        Consider factors like:
        - Severity of the issue
        - Time sensitivity
        - Public safety implications
        - Legal complexity
        - Potential for media attention
        - Statute of limitations concerns
        - Evidence preservation needs
        - Victim vulnerability

        Respond in this exact JSON format:
        {
          "shouldEscalate": boolean,
          "confidence": number,
          "reasons": ["reason1", "reason2"],
          "suggestedPriority": "Normal|High|Critical",
          "urgencyScore": number,
          "riskFactors": ["factor1", "factor2"],
          "recommendation": "detailed recommendation text"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a legal case analysis AI that helps determine if cases need escalation. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0].message?.content;
      console.log("Content ", content);

      if (!content) {
        throw new Error("No response from AI service");
      }

      // Parse the JSON response
      const analysis: EscalationAnalysis = this.parseOpenAIResponse(content);

      // Validate the response structure
      if (
        typeof analysis.shouldEscalate !== "boolean" ||
        typeof analysis.confidence !== "number" ||
        !Array.isArray(analysis.reasons) ||
        !["Normal", "High", "Critical"].includes(analysis.suggestedPriority) ||
        typeof analysis.urgencyScore !== "number"
      ) {
        throw new Error("Invalid AI response structure");
      }

      // Ensure confidence is between 0 and 1
      analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

      // Ensure urgency score is between 1 and 10
      analysis.urgencyScore = Math.max(
        1,
        Math.min(10, Math.floor(analysis.urgencyScore))
      );

      logger.info(
        `AI escalation analysis completed for case. Should escalate: ${analysis.shouldEscalate}, Confidence: ${analysis.confidence}`
      );

      return analysis;
    } catch (error) {
      logger.error("Error in AI escalation analysis:", error);

      // Return a conservative default analysis if AI fails
      return {
        shouldEscalate: false,
        confidence: 0.1,
        reasons: ["AI analysis failed - manual review required"],
        suggestedPriority: "Normal",
        urgencyScore: 5,
        riskFactors: ["Unable to assess risk factors"],
        recommendation:
          "AI analysis unavailable. Please review case manually and use professional judgment for escalation decision.",
      };
    }
  }

  parseOpenAIResponse(rawResponse: string) {
    const jsonString = rawResponse
      .replace(/^```json\s*/i, "") 
      .replace(/^```\s*/i, "") 
      .replace(/```$/, "") 
      .trim();
    return JSON.parse(jsonString);
  }
}
