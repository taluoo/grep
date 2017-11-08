const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

// man grep:
// -h, --no-filename : Never print filename headers (i.e. filenames) with output lines.
// -i, --ignore-case : Perform case insensitive matching.  By default, grep is case sensitive.
// -r, --recursive : Read  all  files  under each directory, recursively, following symbolic links only if they are on the command line.
// ...
// Any meta-character with special meaning may be quoted by preceding it with a backslash.
// ...
// The grep utility exits with one of the following values:
// 0     One or more lines were selected.
// 1     No lines were selected.
// >1    An error occurred.

/**
 * 在 targetPath 中 grep 指定 patterns
 * @param patterns: 默认大小写敏感
 * @param targetPath: 可以是目录，也可以是文件
 * @param options
 * @return {Promise}
 */
function grep(patterns, targetPath, options = []) {
    return new Promise(function (resolve, reject) {
        if (!Array.isArray(patterns)) {
            throw(new Error('grep(patterns, targetPath) 参数 patterns 类型应该为数组'))
        }
        if (typeof targetPath !== 'string' || !fs.existsSync(targetPath)) {
            throw(new Error('grep(patterns, targetPath) 请指定正确的目标路径 targetPath'))
        }

        let stats = fs.lstatSync(targetPath);
        let cwd;

        if (stats.isDirectory()) {
            options.push('-r');
            cwd = targetPath;
            patterns.forEach(pat => options.push('-e', pat));
            options.push('.'); // 因为下面把 cwd 设置为了 targetPath，所以这里用 . 表示当前目录即可。这样做是为了避免输出整个文件路径
        } else if (stats.isFile()) {
            cwd = path.dirname(targetPath);
            patterns.forEach(pat => options.push('-e', pat));
            options.push(path.basename(targetPath))
        } else {
            throw(new Error('grep(patterns, targetPath) targetPath 既不是文件夹也不是文件 '))
        }

        // console.log(options);
        let grep = spawn('grep', options, {cwd});

        let bufArray = [];
        let bytesLen = 0;
        grep.stdout.on('data', function (data) {
            bufArray.push(data);
            bytesLen += data.length;
            // console.log('grep stdout ondata');
            // console.log(data.toString());
        });
        grep.stderr.on('data', function (data) {
            // console.log('grep stderr ondata');
            // console.log(data.toString());
        });
        grep.on('close', (code) => {
            // console.log(code);
            if (code === 0) {
                let buffers = Buffer.concat(bufArray, bytesLen);
                resolve({
                    matched: true,
                    patterns: patterns,
                    data: buffers.toString()
                })
            } else if (code === 1) {
                // console.log(`没有匹配到 ${patterns}`);
                resolve({
                    matched: false,
                    patterns: patterns
                })
            } else {
                reject(new Error('grep exit with error code'))
            }
        });
        grep.on('error', err => {
            console.log('grep onerror');
            console.log(err);
            reject(err);
        });
        // grep.on('exit', (code, signal) => {
        //     console.log('grep onexit');
        //     console.log(code);
        //     console.log(signal);
        // });
    });
}

module.exports = grep;