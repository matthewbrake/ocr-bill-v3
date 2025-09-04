
import React from 'react';
import FileUpload from './FileUpload';
import { CameraIcon, UploadIcon } from './icons';

interface WelcomeProps {
    onImageSelected: (base64Image: string) => void;
    onCameraClick: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onImageSelected, onCameraClick }) => {
    return (
        <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <UploadIcon className="mx-auto h-16 w-16 text-cyan-400 mb-4" />
            <h2 className="text-3xl font-extrabold text-white mb-2">Welcome to the AI Bill Analyzer</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Simply upload or take a picture of your utility bill to get started. The AI will extract and organize all the key details for you.
            </p>
            <div className="max-w-3xl mx-auto">
                <FileUpload onImageSelected={onImageSelected} />
            </div>
            <div className="flex items-center my-8">
                <hr className="flex-grow border-t border-gray-600" />
                <span className="px-4 text-gray-500 font-medium">OR</span>
                <hr className="flex-grow border-t border-gray-600" />
            </div>
            <button
                onClick={onCameraClick}
                className="inline-flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
                <CameraIcon className="h-6 w-6" />
                Use Camera to Scan Bill
            </button>
        </div>
    );
};

export default Welcome;
