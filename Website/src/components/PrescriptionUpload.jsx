import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import Button from './Button';
import { usePrescriptions } from '../hooks/usePrescriptions';
import { supabase } from '../lib/supabase';

const PrescriptionUpload = ({ isOpen, onClose, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const { uploadPrescription, loading, error } = usePrescriptions();
    const [dragActive, setDragActive] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        if (file.size > 1 * 1024 * 1024) { // 1MB
            alert("File size exceeds 1MB limit. Please compress your image.");
            return false;
        }
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (validateFile(e.dataTransfer.files[0])) {
                setFile(e.dataTransfer.files[0]);
            }
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (validateFile(e.target.files[0])) {
                setFile(e.target.files[0]);
            }
        }
    };




    const handleSubmit = async () => {
        if (!file) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please login first");
                return;
            }
            await uploadPrescription(file, user.id);
            setIsSuccess(true);
            setTimeout(() => {
                setFile(null);
                setIsSuccess(false);
                onUploadComplete();
                onClose();
            }, 2000);
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose}>
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors z-50"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-sage-900 mb-2">Prescription Uploaded!</h3>
                            <p className="text-stone-500 max-w-xs mx-auto">We have received your prescription and will verify it shortly.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold font-serif text-sage-900 mb-4">Upload Prescription</h2>

                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-saffron-500 bg-saffron-50' : 'border-sage-200 hover:border-saffron-300'}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                {!file ? (
                                    <>
                                        <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="text-stone-600 font-medium mb-1">Click or drag file to upload</p>
                                        <p className="text-xs text-stone-400">PDF, JPG, PNG up to 1MB</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="file-upload"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
                                    </>
                                ) : (
                                    <div className="animate-in fade-in">
                                        <div className="w-12 h-12 bg-saffron-100 text-saffron-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <p className="text-stone-800 font-medium truncate px-4">{file.name}</p>
                                        <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline mt-2 cursor-pointer z-10 relative">Remove</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <p className="text-xs text-yellow-800">
                                    <span className="font-bold">Note:</span> Please ensure the prescription image is clear, not blurred, and includes the doctor's details and date. Valid up to 6 months.
                                </p>
                            </div>

                            <div className="mt-6">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!file || loading}
                                    className="w-full"
                                >
                                    {loading ? 'Uploading...' : 'Upload Prescription'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
        , document.body);
};

export default PrescriptionUpload;
