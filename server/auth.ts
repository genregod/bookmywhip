import crypto from 'crypto';

/**
 * Generates a password hash using scrypt
 * @param password The plaintext password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Use scrypt for password hashing (more secure than bcrypt)
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Format: scrypt$salt$derivedKey
      resolve(`scrypt$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a password against a hash
 * @param password The plaintext password to verify
 * @param hash The stored password hash
 * @returns A promise that resolves to a boolean indicating if the password is valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Parse the hash format: scrypt$salt$derivedKey
    const [algorithm, salt, key] = hash.split('$');
    
    if (algorithm !== 'scrypt') {
      reject(new Error('Unsupported hash algorithm'));
      return;
    }
    
    // Use scrypt to hash the password with the same salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Compare the derived keys
      resolve(derivedKey.toString('hex') === key);
    });
  });
}
