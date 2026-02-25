import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'User Data Deletion Instructions',
    description: 'How to delete your data from our app.',
};

export default function UserDataDeletionPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">User Data Deletion Instructions</h1>

                <div className="prose prose-slate max-w-none space-y-4">
                    <p className="text-slate-600">
                        We value your privacy. If you have logged into our app using your Facebook account and
                        would like to completely remove your account and all associated data from our servers,
                        you can do so by following the instructions below.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-6">Option 1: Delete from your Account Dashboard</h2>
                    <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4">
                        <li>Log in to your account on our platform.</li>
                        <li>Go to your <strong>Settings</strong> or <strong>Profile</strong> page.</li>
                        <li>Scroll down to the <strong>Danger Zone</strong> section.</li>
                        <li>Click on <strong>Delete Account</strong> and confirm your action.</li>
                    </ol>
                    <p className="text-slate-500 text-sm italic">
                        Note: This action is irreversible. All your campaigns, connected pages, and wallet data will be permanently deleted.
                    </p>

                    <h2 className="text-xl font-semibold text-slate-800 mt-6">Option 2: Disconnect via Facebook</h2>
                    <p className="text-slate-600">
                        You can also remove our application's access directly from your Facebook settings:
                    </p>
                    <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4">
                        <li>Go to your Facebook Settings taking care to be logged into your account.</li>
                        <li>Navigate to <strong>Settings & Privacy</strong> &gt; <strong>Settings</strong>.</li>
                        <li>Look for <strong>Apps and Websites</strong> in the left-hand menu.</li>
                        <li>Find our App in the list of active apps.</li>
                        <li>Click <strong>Remove</strong> and confirm your choice.</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-slate-800 mt-6">Need Help?</h2>
                    <p className="text-slate-600">
                        If you encounter any issues while trying to delete your data, or if you prefer us to
                        handle the deletion for you, please contact our support team. We will process your
                        request within 48 hours.
                    </p>
                </div>

                <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
                    <Link href="/">
                        <button className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Return to Home</button>
                    </Link>
                    <Link href="/login">
                        <button className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white border border-[#1877F2]/50 rounded-lg text-sm font-medium shadow-sm transition-colors">Login to Account</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
