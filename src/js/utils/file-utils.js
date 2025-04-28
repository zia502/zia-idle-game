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
            // 将数据转换为JSON字符串
            let jsonData = JSON.stringify(data);
            
            // 简单加密（如果需要）
            if (encrypt) {
                jsonData = this.encryptData(jsonData);
            }
            
            // 创建Blob对象
            const blob = new Blob([jsonData], { type: 'application/octet-stream' });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('保存文件失败:', error);
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
        // 先进行Base64编码
        const base64 = btoa(data);
        
        // 简单的字符替换（可以根据需要增强）
        return 'ZIA1' + base64.split('').map(char => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(code + 1);
        }).join('');
    },
    
    /**
     * 简单解密数据
     * @param {string} encryptedData - 加密的数据
     * @returns {string} 解密后的数据
     */
    decryptData(encryptedData) {
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
        
        // Base64解码
        return atob(base64);
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
