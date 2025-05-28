"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSingleSecureEntrySystems } from '@/apis/SecureEntrySystemApi';
import { toast } from "react-toastify";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface SecureEntryData {
    id: string;
    file: string;
    descriptions: string;
    referenceCode: string;
    createdAt: string;
    updatedAt: string;
}

function AliasDashboard() {
    const router = useRouter();
    const params = useParams();
    const referenceCode = params.referenceCode as string;
    const [data, setData] = useState<SecureEntryData | null>(null);
    const [qrCode, setQrCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            if (!referenceCode) {
                router.push('/');
                return;
            }

            try {
                const response = await getSingleSecureEntrySystems(referenceCode);
                if (!response.data) {
                    setError('Invalid reference code. Please check and try again.');
                    toast.error('Invalid reference code');
                } else {
                    setData(response.data);
                    setQrCode(response.qrCode);
                }
            } catch (err: any) {
                // Handle specific error cases
                if (err.response?.status === 404) {
                    setError('Reference code not found. Please check and try again.');

                } else {
                    setError('Failed to fetch secure entry data. Please try again later.');
                    toast.error('Failed to fetch data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [referenceCode, router]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-600">Loading secure entry data...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <div className="mb-6">
                        <svg
                            className="mx-auto h-12 w-12 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Data Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'Invalid reference code. Please check and try again.'}</p>
                    <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="w-full cursor-pointer text-blue-500 hover:text-blue-600 border-blue-500 hover:border-blue-600"
                    >
                        Return to Home
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
                <div className="text-center p-8">
                    <p className="text-lg mb-4">No data found for this reference code</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-500 hover:text-blue-600 cursor-pointer"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-160px)] py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Button
                    onClick={() => router.push('/')}
                    variant="ghost"
                    className="mb-6 cursor-pointer text-blue-500 hover:text-blue-600 flex items-center gap-2"
                >
                    <ArrowLeft /> Back to Home
                </Button>

                <div className="bg-white border rounded-lg shadow-md overflow-hidden">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold mb-6">Secure Entry Details</h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-gray-500">Reference Code</h2>
                                    <p className="font-semibold">{data.referenceCode}</p>
                                </div>
                                <div>
                                    <h2 className="text-gray-500 mb-2">File</h2>
                                    <Link
                                        href={data.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
                                    >
                                        <span>View Document</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </Link>
                                </div>
                                <div>
                                    <h2 className="text-gray-500">Description</h2>
                                    <p className="whitespace-pre-wrap">{data.descriptions}</p>
                                </div>

                            </div>

                            <div className="flex flex-col items-center">
                                <h2 className="text-gray-500 mb-4">QR Code</h2>
                                {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48" />}
                            </div>
                        </div>

                        <div className="mt-8">
                            <div>
                                <h2 className="text-gray-500">Created At</h2>
                                <p>{new Date(data.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AliasDashboard; 