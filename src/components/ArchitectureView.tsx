import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Fingerprint,
  Lock,
  Zap,
  Smartphone,
  Globe,
  Database,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Code,
  Key,
} from 'lucide-react';
import { checkBiometricsSupport, enrollBiometrics, authenticateWithBiometrics } from '../services/biometrics';
import { deriveKey, encryptText, decryptText, generateSalt } from '../services/crypto';

export const ArchitectureView: React.FC = () => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [cryptoSpeed, setCryptoSpeed] = useState<string | null>(null);
  const [isTestingBio, setIsTestingBio] = useState(false);

  // Run real-time crypto benchmark
  const handleBenchmarkCrypto = async () => {
    try {
      const t0 = performance.now();
      const salt = generateSalt();
      const key = await deriveKey('1234', salt);
      const { cipherHex, ivHex } = await encryptText('Sensitive Financial Record: Salary $96,000', key);
      const decrypted = await decryptText(cipherHex, ivHex, key);
      const t1 = performance.now();

      setCryptoSpeed(
        `PBKDF2 (100k rounds) + AES-GCM completed in ${(t1 - t0).toFixed(1)}ms. Decrypted: "${decrypted}"`
      );
    } catch (err: unknown) {
      setCryptoSpeed('Crypto test error: ' + String(err));
    }
  };

  const handleTestBiometrics = async () => {
    setIsTestingBio(true);
    setTestResult('Querying device platform authenticator...');
    try {
      const support = await checkBiometricsSupport();
      if (!support.isAvailable) {
        setTestResult('WebAuthn not supported in this browser context.');
        return;
      }

      setTestResult('Prompting Touch ID / Face ID / Windows Hello...');
      const credId = await enrollBiometrics('zenith-architect');
      const verified = await authenticateWithBiometrics(credId);
      setTestResult(
        verified
          ? 'Biometric verified successfully via WebAuthn Platform Authenticator!'
          : 'Biometric verification prompt was dismissed.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult(`Biometric test note: ${msg} (Device PIN fallback is active).`);
    } finally {
      setIsTestingBio(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* View Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Security, Biometrics &amp; Cross-Platform Architecture</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Technical evaluation: Flutter vs React Native vs Web, E2EE cryptographic pipelines &amp; offline sync
            </p>
          </div>
        </div>
      </div>

      {/* FRAMEWORK COMPARISON MATRIX: Flutter vs React Native vs Web */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Cross-Platform Framework Comparison: Biometric-Heavy &amp; Financial Apps</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Comparative analysis based on native hardware bridge consistency, thread isolation, and offline E2EE
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="py-3 px-3">Evaluation Vector</th>
                <th className="py-3 px-3 text-emerald-400 font-bold">Flutter (Dart / Impeller)</th>
                <th className="py-3 px-3 text-indigo-400 font-bold">React Native (Fabric / Hermes)</th>
                <th className="py-3 px-3 text-cyan-400 font-bold">PWA / Web (WebAuthn &amp; WebCrypto)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              <tr>
                <td className="py-3 px-3 font-semibold text-neutral-200">Biometric Bridge Consistency</td>
                <td className="py-3 px-3 text-neutral-300">
                  <span className="font-semibold text-emerald-400">Superior (9.8/10)</span>. <code>local_auth</code> plugin maintained by Flutter team provides unified API for Face ID, Touch ID, BiometricPrompt, and fallback pin without bridge lag.
                </td>
                <td className="py-3 px-3 text-neutral-400">
                  <span className="font-semibold text-amber-400">Moderate (8.2/10)</span>. Requires 3rd-party community packages (<code>react-native-biometrics</code>) with occasional iOS/Android lifecycle mismatch.
                </td>
                <td className="py-3 px-3 text-neutral-300">
                  <span className="font-semibold text-cyan-400">High (9.0/10)</span>. W3C standard WebAuthn API native to modern Safari iOS 18+, Chrome Android, and Windows Hello.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-neutral-200">Hardware Enclave &amp; KeyStore Access</td>
                <td className="py-3 px-3 text-neutral-300">
                  Direct C/C++ FFI bindings to Apple Keychain Secure Enclave &amp; Android KeyStore StrongBox via <code>flutter_secure_storage</code>.
                </td>
                <td className="py-3 px-3 text-neutral-400">
                  JSI TurboModules provide direct access to Keychain/KeyStore, but higher bridge surface area.
                </td>
                <td className="py-3 px-3 text-neutral-300">
                  Hardware-backed credentials managed by OS browser subsystem with zero plaintext key exposure.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-neutral-200">UI Scaling &amp; Sub-pixel Precision</td>
                <td className="py-3 px-3 text-neutral-300">
                  Pixel-perfect consistency across iOS and Android via custom canvas rendering (Impeller / Skia).
                </td>
                <td className="py-3 px-3 text-neutral-400">
                  Uses native platform widgets; platform-specific quirks on Android vs iOS border radiuses and shadows.
                </td>
                <td className="py-3 px-3 text-neutral-300">
                  Tailwind CSS dynamic viewport units (<code>dvh</code>, <code>svh</code>) and CSS container queries scale seamlessly.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-neutral-200">Offline-First Database &amp; Sync</td>
                <td className="py-3 px-3 text-neutral-300">
                  Ultra-fast native embedded databases: <strong>Isar</strong>, <strong>Hive</strong>, or <strong>sqlite3</strong> with reactive query streams.
                </td>
                <td className="py-3 px-3 text-neutral-400">
                  <strong>WatermelonDB</strong> or <strong>op-sqlite</strong> with JSI SQLite bridge.
                </td>
                <td className="py-3 px-3 text-neutral-300">
                  <strong>IndexedDB</strong> + LocalStorage with Web Worker background synchronization.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-neutral-200">Verdict for Financial &amp; Biometric Apps</td>
                <td className="py-3 px-3 text-emerald-300 font-medium bg-emerald-500/5">
                  ✓ Ideal for standalone native mobile builds requiring strictly deterministic UI and hardened hardware biometric locks.
                </td>
                <td className="py-3 px-3 text-neutral-300">
                  ✓ Excellent if leveraging an existing web React codebase for code reuse with React Native.
                </td>
                <td className="py-3 px-3 text-cyan-300 font-medium bg-cyan-500/5">
                  ✓ Zero-install, instant multi-device synchronization across Web, iOS, Android, and Desktop simultaneously.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BIOMETRIC & E2EE SECURITY ARCHITECTURE DIAGRAM */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Biometric Flow Structure */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Fingerprint className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Biometric Authentication Flow
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Security pipeline enforcing hardware verification before unlocking sensitive financial balances.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono font-bold text-emerald-400">
                1
              </span>
              <div>
                <div className="font-semibold text-neutral-200">Challenge Generation</div>
                <div className="text-[11px] text-neutral-400">
                  Cryptographic random 32-byte nonces generated client-side with <code>crypto.getRandomValues</code>.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono font-bold text-emerald-400">
                2
              </span>
              <div>
                <div className="font-semibold text-neutral-200">Secure Enclave Hardware Verification</div>
                <div className="text-[11px] text-neutral-400">
                  OS prompts Face ID / Touch ID / Fingerprint sensor. Raw biometric data NEVER leaves the hardware chip.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono font-bold text-emerald-400">
                3
              </span>
              <div>
                <div className="font-semibold text-neutral-200">Key Derivation &amp; Decryption</div>
                <div className="text-[11px] text-neutral-400">
                  On successful biometric assertion, the master vault AES-256 key is unlocked in volatile RAM memory.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono font-bold text-emerald-400">
                4
              </span>
              <div>
                <div className="font-semibold text-neutral-200">Auto-Lock Guard &amp; Zeroization</div>
                <div className="text-[11px] text-neutral-400">
                  Idle timeout (e.g. 5 mins) automatically zeroizes memory buffers and re-engages biometric lock screen.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* E2EE Zero-Knowledge Cryptography */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              End-to-End Encryption (E2EE) Pipeline
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Zero-knowledge design: the server or cloud backup never sees your unencrypted salary, transactions, or private notes.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <Key className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-neutral-200">PBKDF2 Key Derivation</div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  HMAC-SHA256 • 100,000 rounds • 128-bit Salt
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-neutral-200">AES-256-GCM Authenticated Cipher</div>
                <div className="text-[11px] text-neutral-400">
                  96-bit unique IV generated per record with Galois/Counter Mode integrity tag preventing tampering.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <Database className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-neutral-200">Local-First Storage &amp; Cloud Backup</div>
                <div className="text-[11px] text-neutral-400">
                  Encrypted ciphertext stored in local IndexedDB. Cloud sync backups are fully encrypted blobs (.vault).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE INTERACTIVE CRYPTO & BIOMETRIC BENCHMARK */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Interactive Cryptographic &amp; Biometric Diagnostic Bench</span>
        </h3>
        <p className="text-xs text-neutral-400 mb-5">
          Verify device-level Web Crypto API throughput and WebAuthn platform authenticator status directly in your browser.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBenchmarkCrypto}
            className="flex items-center gap-2 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Benchmark AES-256-GCM Performance</span>
          </button>

          <button
            onClick={handleTestBiometrics}
            disabled={isTestingBio}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
          >
            <Fingerprint className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isTestingBio ? 'Testing Sensor...' : 'Test Device Biometrics (WebAuthn)'}</span>
          </button>
        </div>

        {cryptoSpeed && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-300">
            {cryptoSpeed}
          </div>
        )}

        {testResult && (
          <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-800/80 p-3 text-xs font-mono text-neutral-200">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};
