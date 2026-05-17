package com.floralwhisper.service;

import com.floralwhisper.dto.AdminBackupFileResponse;
import com.floralwhisper.dto.OperationLogArchiveFileResponse;
import java.io.File;

final class BackupFileViewFactory {

  private final StorageDisplayFormatter storageDisplayFormatter;
  private final DirectorySizeCalculator directorySizeCalculator;

  BackupFileViewFactory(
      StorageDisplayFormatter storageDisplayFormatter,
      DirectorySizeCalculator directorySizeCalculator) {
    this.storageDisplayFormatter = storageDisplayFormatter;
    this.directorySizeCalculator = directorySizeCalculator;
  }

  OperationLogArchiveFileResponse createOperationLogArchiveFileResponse(File file) {
    OperationLogArchiveFileResponse response = new OperationLogArchiveFileResponse();
    response.setFilename(file.getName());
    response.setPath(file.getAbsolutePath());
    response.setModifiedAt(storageDisplayFormatter.formatBackupModifiedAt(file));
    response.setSize(storageDisplayFormatter.formatBytes(file.length()));
    response.setDownloadUrl("/api/admin/system/operation-logs/archive-files/" + file.getName() + "/download");
    return response;
  }

  AdminBackupFileResponse createAdminBackupFileResponse(File backupDir, boolean latest) {
    AdminBackupFileResponse response = new AdminBackupFileResponse();
    response.setBackupName(backupDir.getName());
    response.setPath(backupDir.getAbsolutePath());
    response.setModifiedAt(storageDisplayFormatter.formatBackupModifiedAt(backupDir));
    response.setSize(storageDisplayFormatter.formatBytes(directorySizeCalculator.calculate(backupDir)));
    response.setDownloadUrl("/api/admin/system/backups/" + backupDir.getName() + "/download");
    response.setLatest(latest);
    return response;
  }
}
