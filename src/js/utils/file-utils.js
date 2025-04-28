/**
 * 文件工具模块 - 负责处理文件下载和上传
 */
const FileUtils = {
    /**
     * 将数据保存为文件并下载
     * @param {object} data - 要保存的数据
     * @param {string} filename - 文件名
     * @param {boolean} encrypt - 是否加密数据
     */
    saveToFile(data, filename, encrypt = true) {
        try {
            console.log('开始保存文件:', filename);

            // 将数据转换为JSON字符串
            console.log('将数据转换为JSON字符串');
            let jsonData = JSON.stringify(data);

            // 简单加密（如果需要）
            if (encrypt) {
                console.log('加密数据');
                try {
                    jsonData = this.encryptData(jsonData);
                    console.log('数据加密成功');
                } catch (encryptError) {
                    console.error('数据加密失败:', encryptError);
                    throw new Error('数据加密失败: ' + encryptError.message);
                }
            }

            // 创建Blob对象
            console.log('创建Blob对象');
            const blob = new Blob([jsonData], { type: 'application/octet-stream' });

            // 创建下载链接
            console.log('创建下载链接');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;

            // 触发下载
            console.log('触发下载');
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('文件保存完成:', filename);
            }, 100);

            return true;
        } catch (error) {
            console.error('保存文件失败:', error);
            alert('保存文件失败: ' + error.message);
            return false;
        }
    },

    /**
     * 从文件加载数据
     * @param {File} file - 文件对象
     * @param {boolean} decrypt - 是否解密数据
     * @returns {Promise<object>} 解析后的数据
     */
    loadFromFile(file, decrypt = true) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    let jsonData = event.target.result;

                    // 解密数据（如果需要）
                    if (decrypt) {
                        jsonData = this.decryptData(jsonData);
                    }

                    // 解析JSON数据
                    const data = JSON.parse(jsonData);
                    resolve(data);
                } catch (error) {
                    console.error('解析文件失败:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('读取文件失败:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    },

    /**
     * 简单加密数据（Base64 + 简单替换）
     * @param {string} data - 要加密的数据
     * @returns {string} 加密后的数据
     */
    encryptData(data) {
        try {
            // 使用UTF-8编码处理Unicode字符
            // 先将字符串转换为UTF-8编码的字节数组
            const utf8Encoder = new TextEncoder();
            const utf8Bytes = utf8Encoder.encode(data);

            // 将字节数组转换为Base64字符串
            let base64 = '';
            const len = utf8Bytes.length;
            for (let i = 0; i < len; i += 3) {
                base64 += this._encodeBase64Chunk(
                    utf8Bytes[i],
                    i + 1 < len ? utf8Bytes[i + 1] : undefined,
                    i + 2 < len ? utf8Bytes[i + 2] : undefined
                );
            }

            // 简单的字符替换（可以根据需要增强）
            return 'ZIA1' + base64.split('').map(char => {
                const code = char.charCodeAt(0);
                return String.fromCharCode(code + 1);
            }).join('');
        } catch (error) {
            console.error('加密数据失败:', error);
            throw new Error('加密数据失败: ' + error.message);
        }
    },

    /**
     * 编码Base64块
     * @private
     */
    _encodeBase64Chunk(byte1, byte2, byte3) {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const chunk = (byte1 << 16) | ((byte2 || 0) << 8) | (byte3 || 0);

        const char1 = base64Chars[(chunk >> 18) & 63];
        const char2 = base64Chars[(chunk >> 12) & 63];
        const char3 = byte2 !== undefined ? base64Chars[(chunk >> 6) & 63] : '=';
        const char4 = byte3 !== undefined ? base64Chars[chunk & 63] : '=';

        return char1 + char2 + char3 + char4;
    },

    /**
     * 简单解密数据
     * @param {string} encryptedData - 加密的数据
     * @returns {string} 解密后的数据
     */
    decryptData(encryptedData) {
        try {
            // 检查文件头
            if (!encryptedData.startsWith('ZIA1')) {
                throw new Error('无效的存档文件格式');
            }

            // 移除文件头
            const data = encryptedData.substring(4);

            // 反向字符替换
            const base64 = data.split('').map(char => {
                const code = char.charCodeAt(0);
                return String.fromCharCode(code - 1);
            }).join('');

            // 解码Base64为字节数组
            const bytes = this._decodeBase64ToBytes(base64);

            // 将字节数组转换为UTF-8字符串
            const utf8Decoder = new TextDecoder('utf-8');
            return utf8Decoder.decode(bytes);
        } catch (error) {
            console.error('解密数据失败:', error);
            throw new Error('解密数据失败: ' + error.message);
        }
    },

    /**
     * 解码Base64为字节数组
     * @private
     */
    _decodeBase64ToBytes(base64) {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        // 移除填充字符
        let str = base64.replace(/=+$/, '');

        // 计算输出长度
        const outputLength = Math.floor((str.length * 3) / 4);
        const bytes = new Uint8Array(outputLength);

        // 解码
        let p = 0;
        for (let i = 0; i < str.length; i += 4) {
            const encoded1 = base64Chars.indexOf(str[i]);
            const encoded2 = base64Chars.indexOf(str[i + 1]);
            const encoded3 = base64Chars.indexOf(str[i + 2] || 'A');
            const encoded4 = base64Chars.indexOf(str[i + 3] || 'A');

            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            if (str[i + 2]) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            if (str[i + 3]) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
        }

        return bytes;
    },

    /**
     * 验证文件是否为有效的.zia存档
     * @param {File} file - 文件对象
     * @returns {Promise<boolean>} 是否为有效存档
     */
    validateSaveFile(file) {
        return new Promise((resolve) => {
            // 检查文件扩展名
            if (!file.name.toLowerCase().endsWith('.zia')) {
                resolve(false);
                return;
            }

            // 读取文件头部
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = event.target.result;
                    // 检查文件头标识
                    resolve(data.startsWith('ZIA1'));
                } catch (error) {
                    resolve(false);
                }
            };
            reader.onerror = () => resolve(false);

            // 只读取文件的前10个字节
            reader.readAsText(file.slice(0, 10));
        });
    }
};
