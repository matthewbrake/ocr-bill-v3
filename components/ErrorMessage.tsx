
import React from 'react';
import { ExclamationCircleIcon, XIcon } from './icons';

interface ErrorMessageProps {
    message: string;
    onClear: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
    return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start gap-4" role="alert">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
            <div>
                <strong className="font-bold">An Error Occurred</strong>
                <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">{message}</span>
            </div>
            <button onClick={onClear} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                 <XIcon className="h-5 w-5"/>
            </button>
        </div>
    );
};

export default ErrorMessage;
