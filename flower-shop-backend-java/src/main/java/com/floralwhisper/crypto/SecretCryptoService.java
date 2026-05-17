package com.floralwhisper.crypto;

import com.floralwhisper.config.AppProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class SecretCryptoService {
  private static final String PREFIX = "enc:v1:";
  private static final int GCM_TAG_BITS = 128;
  private static final int IV_LENGTH = 12;

  private final SecretKeySpec secretKeySpec;
  private final SecureRandom secureRandom = new SecureRandom();

  public SecretCryptoService(AppProperties properties) {
    this.secretKeySpec = new SecretKeySpec(deriveKey(properties.getSecurity().getDataEncryptionKey()), "AES");
  }

  public String encrypt(String raw) {
    if (raw == null) {
      return null;
    }
    String normalized = raw.trim();
    if (normalized.isEmpty()) {
      return "";
    }
    if (isEncrypted(normalized)) {
      return normalized;
    }
    try {
      byte[] iv = new byte[IV_LENGTH];
      secureRandom.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, new GCMParameterSpec(GCM_TAG_BITS, iv));
      byte[] encrypted = cipher.doFinal(normalized.getBytes(StandardCharsets.UTF_8));
      ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
      buffer.put(iv);
      buffer.put(encrypted);
      return PREFIX + Base64.getEncoder().encodeToString(buffer.array());
    } catch (GeneralSecurityException error) {
      throw new IllegalStateException("敏感数据加密失败", error);
    }
  }

  public String decrypt(String value) {
    if (value == null) {
      return null;
    }
    String normalized = value.trim();
    if (normalized.isEmpty()) {
      return "";
    }
    if (!isEncrypted(normalized)) {
      return normalized;
    }
    try {
      byte[] payload = Base64.getDecoder().decode(normalized.substring(PREFIX.length()));
      ByteBuffer buffer = ByteBuffer.wrap(payload);
      byte[] iv = new byte[IV_LENGTH];
      buffer.get(iv);
      byte[] encrypted = new byte[buffer.remaining()];
      buffer.get(encrypted);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new GCMParameterSpec(GCM_TAG_BITS, iv));
      return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    } catch (IllegalArgumentException | GeneralSecurityException error) {
      throw new IllegalStateException("敏感数据解密失败", error);
    }
  }

  public boolean isEncrypted(String value) {
    return value != null && value.startsWith(PREFIX);
  }

  private byte[] deriveKey(String rawKey) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return digest.digest((rawKey == null ? "" : rawKey).getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException error) {
      throw new IllegalStateException("加密主密钥派生失败", error);
    }
  }
}
