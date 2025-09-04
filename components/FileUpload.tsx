
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
    onImageSelected: (base64Image: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (file: File | null) => {
        if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageSelected(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Handle error for invalid file type
            alert("Please upload a valid image file (PNG, JPG, WEBP).");
        }
    };

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    
    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onImageSelected]);

    return (
        <div 
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'border-cyan-400 bg-gray-700 scale-105' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-700/50'}`}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            />
            <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                <UploadIcon className="w-10 h-10" />
                <p className="font-semibold">
                    <span className="text-cyan-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm">PNG, JPG, or WEBP</p>
            </div>
        </div>
    );
};

export default FileUpload;
