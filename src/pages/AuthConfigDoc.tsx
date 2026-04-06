import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhibLa/FFIhaCpQ4IL2yI
J5ia+jYWZ7VRDI8pNViMm4ptln1q7qXHt/zjERDqLQF2MLN1lvjFNOucNpS2enSI
aZUy/mdLwSvU/TjU5JwsdAK5ANLo9pqQoTvg8UCQCRn+gN1CMEhByXPSHR9QB9n4
DIYwwkACa0TPDHA1ggbnAIVb9ZI23dxQBUOZQ9nOOvwZcHQ5JSuhY6RPYnRzRfrw
2mkuIU9f9pd6txvqhm/lY1MOlrQJovbpoCZ5XavNh+XQfeHF5xPkWUBAAzCIUGPb
djj1p6pc15mnOdmSWmqLOhjppxn5cz/ViOexzIZHz3aMRC7ISElPua0Ek9v0Qot0
dwIDAQAB
-----END PUBLIC KEY-----`;

// ── Reusable Code Block Component ─────────────────────────────────────────
interface CodeBlockProps {
  code: string;
  method?: "POST" | "GET";
  endpoint?: string;
  title?: string;
  textColor?: string;
}

const CodeBlock = ({ code, method, endpoint, title, textColor = "text-gray-300" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-border overflow-hidden shadow-sm my-4">
      <div className="px-4 py-2.5 border-b border-border/50 bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {method && (
            <span className={`text-xs font-mono font-bold ${method === "POST" ? "text-green-400" : "text-blue-400"}`}>
              {method}
            </span>
          )}
          {endpoint && <span className="text-xs font-mono font-medium text-gray-300">{endpoint}</span>}
          {title && <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">{title}</span>}
        </div>

        <button
          onClick={handleCopy}
          className="group flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors focus:outline-none"
          aria-label="Copy code to clipboard"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-green-400"
              >
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Copy
              </motion.span>
            )}
          </AnimatePresence>

          <div className="relative w-4 h-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.svg
                  key="check-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-4 h-4 text-green-400 absolute"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-4 h-4 absolute group-hover:text-text-primary transition-colors"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>
      <pre className={`p-5 text-sm font-mono overflow-x-auto leading-relaxed ${textColor} selection:bg-accent/30`}>
        {code}
      </pre>
    </div>
  );
};

// ── Main Documentation Page ───────────────────────────────────────────────
export function AuthConfigDoc() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      {/* Top Navigation Bar */}
      <div className="mb-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="group flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-12 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">External API Integration Guide</h1>
        <p className="text-base text-text-muted mt-3 max-w-3xl leading-relaxed">
          This guide provides the necessary steps to securely connect your microservices to the Tenant Configuration Control Panel. 
          We utilize a <strong>Machine-to-Machine (M2M)</strong> architecture, meaning your servers will authenticate directly with ours using Client Credentials, rather than requiring user interaction.
        </p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-16">
        
        {/* Step 1: Authentication */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 border-b border-border/50 pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white font-bold shadow-sm">1</span>
            <h2 className="text-xl font-semibold text-text-primary">Request an Access Token</h2>
          </div>
          
          <div className="pl-12 space-y-4">
            <p className="text-sm text-text-muted leading-relaxed">
              Before accessing any tenant data, your service must prove its identity. Send a POST request containing your assigned <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent border border-border">clientId</code> and <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent border border-border">clientSecret</code>. 
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              <strong>Note:</strong> We strictly enforce IP Whitelisting. If your server makes this request from an unauthorized IP address, it will be rejected with a <code className="text-red-400">403 Forbidden</code> error.
            </p>

            <CodeBlock 
              method="POST" 
              endpoint="/api/token" 
              code={`curl -X POST https://api.yourdomain.com/api/token \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "clientId": "your_client_id_here",\n    "clientSecret": "your_client_secret_here"\n  }'`} 
            />

            <div className="bg-surface-2/50 p-4 rounded-lg border border-border mt-2">
              <h4 className="text-xs font-semibold text-text-primary uppercase mb-1">What you get back:</h4>
              <p className="text-sm text-text-muted">A short-lived JWT (JSON Web Token) valid for 10 minutes. This token is cryptographically signed using the RS256 algorithm.</p>
            </div>
          </div>
        </motion.section>

        {/* Step 2: Fetch Data */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 border-b border-border/50 pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 border border-border text-text-primary font-bold shadow-sm">2</span>
            <h2 className="text-xl font-semibold text-text-primary">Fetch Tenant Configuration Rules</h2>
          </div>
          
          <div className="pl-12 space-y-4">
            <p className="text-sm text-text-muted leading-relaxed">
              With your access token in hand, you can now query the configuration for specific tenants. Attach the token to the <code className="text-text-primary">Authorization</code> header as a Bearer token.
            </p>

            <CodeBlock 
              method="GET" 
              endpoint="/api/external/auth-config/:tenantId" 
              code={`curl -X GET https://api.yourdomain.com/api/external/auth-config/65f1a2... \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`} 
            />
            
            <p className="text-sm text-text-muted leading-relaxed mt-4">
              The response will provide the complete authentication policy for that tenant, dictating whether you should enforce MFA, allow SSO, or restrict session lengths on your end.
            </p>

            <CodeBlock 
              title="Expected Payload Structure"
              textColor="text-green-400"
              code={`{\n  "success": true,\n  "data": {\n    "tenantId": "65f1a2...",\n    "loginMethods": {\n      "emailPassword": true,\n      "googleSSO": false,\n      "otpLogin": false\n    },\n    "passwordPolicy": {\n      "minLength": 8,\n      "requireUppercase": true,\n      "requireNumbers": true,\n      "requireSpecialChar": false,\n      "expiryDays": 90\n    },\n    "mfa": {\n      "enabled": true,\n      "methods": ["OTP"]\n    },\n    "sessionRules": {\n      "timeoutMinutes": 30,\n      "maxLoginAttempts": 5,\n      "lockoutDurationMinutes": 15\n    }\n  }\n}`}
            />
          </div>
        </motion.section>

        {/* Step 3: Offline Verification & Public Key */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 border-b border-border/50 pb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 border border-border text-text-primary font-bold shadow-sm">3</span>
            <h2 className="text-xl font-semibold text-text-primary">Offline Token Verification (Zero Latency)</h2>
          </div>
          
          <div className="pl-12 space-y-4">
            <p className="text-sm text-text-muted leading-relaxed">
              Because we use <strong>RS256 (Asymmetric Cryptography)</strong>, your microservices do not need to make an HTTP network request to our servers every time you want to verify a token's authenticity. 
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              <strong>How to implement:</strong> Store the Public Key below in your server's environment variables. Use a standard library (like <code className="text-accent">jsonwebtoken</code> in Node.js or <code className="text-accent">PyJWT</code> in Python) to verify the token signature locally. Ensure you also check that the token contains the <code className="text-text-primary">read:auth-config</code> scope.
            </p>

            <CodeBlock 
              title="RSA Public Key (PEM Format)" 
              code={RSA_PUBLIC_KEY} 
            />
          </div>
        </motion.section>

      </motion.div>
    </motion.div>
  );
}