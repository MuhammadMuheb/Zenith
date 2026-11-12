/**
 * Biometric Authentication Service (WebAuthn API)
 * Supports Apple Touch ID / Face ID, Windows Hello, and Android Biometrics
 */

export interface BiometricCheckResult {
  isAvailable: boolean;
  platformAuthenticator: boolean;
}

export async function checkBiometricsSupport(): Promise<BiometricCheckResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { isAvailable: false, platformAuthenticator: false };
  }

  try {
    const isPlatform =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      isAvailable: true,
      platformAuthenticator: isPlatform,
    };
  } catch {
    return { isAvailable: false, platformAuthenticator: false };
  }
}

// Enroll biometric passkey
export async function enrollBiometrics(userId: string = 'zenith-user'): Promise<string> {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported on this browser/device.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userIdBytes = new TextEncoder().encode(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Zenith Simple Money App',
      id: window.location.hostname || 'localhost',
    },
    user: {
      id: userIdBytes,
      name: 'user@zenith.local',
      displayName: 'Zenith User',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // FaceID / TouchID / Windows Hello / Android biometric
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Biometric registration was cancelled or timed out.');
  }

  return credential.id;
}

export async function registerBiometrics(
  userName: string = 'User'
): Promise<{ success: boolean; credentialId?: string }> {
  try {
    const credentialId = await enrollBiometrics(userName);
    return { success: true, credentialId };
  } catch (err) {
    console.warn('Biometric enrollment skipped or unsupported:', err);
    return { success: false };
  }
}

// Authenticate via Biometric scan
export async function authenticateWithBiometrics(credentialId?: string): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const allowCredentials: PublicKeyCredentialDescriptor[] = credentialId
    ? [
        {
          id: Uint8Array.from(atob(credentialId.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
            c.charCodeAt(0)
          ),
          type: 'public-key',
        },
      ]
    : [];

  const getOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'preferred',
    rpId: window.location.hostname || 'localhost',
    ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: getOptions,
    });
    return !!assertion;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg || 'Biometric verification failed.');
  }
}
