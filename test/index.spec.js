const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

const grep = require('../index');

describe('grep.js', () => {
    it('should export a function', function () {
        grep.should.be.a('function');
    });
    describe('grep(patterns, targetPath, options = [])', function () {
        let targetDir = __dirname + '/res';
        let targetFile = targetDir + '/read_only.txt';

        it('should return a promise', async function () {
            grep(['randomStr'], targetDir).should.be.a('promise');
        });
        describe('should be rejected', () => {
            it('when patterns is not a array', async function () {
                await grep('notarray', targetDir).should.be.rejectedWith('类型应该为数组');
                await grep('notarray', targetFile).should.be.rejectedWith('类型应该为数组');
            });
            it('when targetFilePath not exist', async function () {
                await grep(['randomStr'], './notexist.txt').should.be.rejectedWith('请指定正确的目标路径')
            });
        });
        describe('should resolve a object', () => {
            it('when match resolve {matched: true, data: "..."}', async function () {
                let dirTestRes = await grep(['abc'], targetDir);
                dirTestRes.should.include({matched: true});
                dirTestRes.should.have.a.property('data');

                let fileTestRes = await grep(['abc'], targetFile);
                fileTestRes.should.include({matched: true});
                fileTestRes.should.have.a.property('data');
            });
            it('when not match resolve {matched: false}', async function () {
                let res = await grep(['notmatch'], targetDir);
                res.should.include({matched: false});
            });
            describe('case sensitive test', function () {
                let pattern = ['ABC'];
                it('should not match', async function () {
                    let dirTestRes = await grep(pattern, targetDir);
                    dirTestRes.should.include({matched: false});

                    let fileTestRes = await grep(pattern, targetFile);
                    fileTestRes.should.include({matched: false});
                });
                it('should match with option -i', async function () {
                    let dirTestRes = await grep(pattern, targetDir, ['-i']);
                    dirTestRes.should.include({matched: true});

                    let fileTestRes = await grep(pattern, targetFile, ['-i']);
                    fileTestRes.should.include({matched: true});
                });
            });
        });
    })
});