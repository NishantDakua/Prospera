import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/context/Web3Provider";
import { AuthProvider } from "@/context/AuthProvider";
import AiAssistant from "@/components/AiAssistant";

export const metadata = {
    title: "Prospera | Premium Collaborative Savings",
    description: "The definitive platform for premium collaborative savings.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <AuthProvider>
                    <Web3Provider>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: "#1A1A22",
                                    color: "#F1F0CC",
                                    border: "1px solid rgba(213,191,134,0.2)",
                                },
                            }}
                        />
                        {children}
                        <AiAssistant />
                    </Web3Provider>
                </AuthProvider>
            </body>
        </html>
    );
}
