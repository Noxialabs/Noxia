import axiosClient from "@/lib/axios/axios";

interface SecureEntryResponse {
    success: boolean;
    data: {
        id: string;
        file: string;
        descriptions: string;
        referenceCode: string;
        createdAt: string;
        updatedAt: string;
    };
    qrCodeDataURL: string;
}

// secure entry system create
export const createSecureEntrySystems = async (file: File, descriptions: string) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('descriptions', descriptions);

        const response = await axiosClient.post<SecureEntryResponse>('/application', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        // console.error('Error creating secure entry:', error);
        throw error;
    }
};

// get single secure entry system
export const getSingleSecureEntrySystems = async (referenceCode: string) => {
    try {
        const response = await axiosClient.get(`/application/${referenceCode}`);
        return response.data;
    } catch (error) {
        // console.error('Error getting single secure entry:', error);
        throw error;
    }
};

//delete secure entry system
export const deleteSecureEntrySystems = async (referenceCode: string) => {
    try {
        const response = await axiosClient.delete(`/application/${referenceCode}`);
        return response.data;
    } catch (error) {
        // console.error('Error deleting secure entry:', error);
        throw error;
    }
};

