# DELIVERY CHECKLIST

交付给客户或部署人员时，至少确认以下内容一并提供：

## 1. 发布包

- `floralwhispertime-release-<release-id>.tar.gz`
- `floralwhispertime-release-<release-id>.tar.gz.sha256`

## 2. 包内关键文件

解压后应包含：

- `INSTALL.md`
- `RELEASE_NOTES.md`
- `CHECKSUMS.sha256`
- `release-verify.sh`
- `release-install.sh`
- `release-upgrade.sh`
- `release-rollback.sh`
- `release-status.sh`
- `release-inspect.sh`

## 3. 交付说明

需要明确告知客户：

- 默认安装目录：`/opt/floralwhispertime`
- 环境文件路径：`/opt/floralwhispertime/shared/.env`
- 上传目录路径：`/opt/floralwhispertime/shared/uploads`
- 默认保留最近 `5` 个 release

## 4. 客户首次安装步骤

```bash
sha256sum -c floralwhispertime-release-<release-id>.tar.gz.sha256
tar -xzf floralwhispertime-release-<release-id>.tar.gz
cd floralwhispertime-release-<release-id>
./release-verify.sh
./release-install.sh
```

## 5. 安装后必须复核

- 修改 `/opt/floralwhispertime/shared/.env` 中的正式密码和域名配置
- 执行一次 `./release-upgrade.sh`
- 执行一次 `./release-inspect.sh`

## 6. 常用运维命令

```bash
./release-upgrade.sh
./release-rollback.sh --latest-previous
./release-status.sh
./release-inspect.sh
```
