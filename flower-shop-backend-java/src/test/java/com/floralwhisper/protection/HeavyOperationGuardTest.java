package com.floralwhisper.protection;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class HeavyOperationGuardTest {

  @Test
  void guardRejectsWhenNoPermitAvailable() {
    HeavyOperationGuard guard = new HeavyOperationGuard(0, 0, 0);
    assertThrows(ServiceBusyException.class, guard::acquireAiPermit);
  }
}
