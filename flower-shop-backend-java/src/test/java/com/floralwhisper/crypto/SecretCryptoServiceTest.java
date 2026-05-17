package com.floralwhisper.crypto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.floralwhisper.config.AppProperties;
import org.junit.jupiter.api.Test;

class SecretCryptoServiceTest {

  @Test
  void encryptAndDecryptRoundTrip() {
    SecretCryptoService service = new SecretCryptoService(properties());

    String encrypted = service.encrypt("secret-value");

    assertTrue(encrypted.startsWith("enc:v1:"));
    assertNotEquals("secret-value", encrypted);
    assertEquals("secret-value", service.decrypt(encrypted));
  }

  @Test
  void decryptRejectsBrokenCiphertext() {
    SecretCryptoService service = new SecretCryptoService(properties());

    assertThrows(IllegalStateException.class, () -> service.decrypt("enc:v1:not-base64%%%"));
  }

  private AppProperties properties() {
    AppProperties properties = new AppProperties();
    properties.getSecurity().setDataEncryptionKey("12345678901234567890123456789012");
    return properties;
  }
}
