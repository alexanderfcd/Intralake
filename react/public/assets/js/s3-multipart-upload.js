(function (){
    var S3Uploader = function (file, tofolder, toproject, query) {

        // https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html
        var maxFileSize = 5000000000000;
        var maxChunks = 10000;



        var scope = this;

        var sessionId = null;

        var parts = [];

        var uploading = false;
        var _events = {};
        this.on = function (e, f) { _events[e] ? _events[e].push(f) : (_events[e] = [f]); return this; };
        this.runEvent = function (e, f) { _events[e] ? _events[e].forEach(function (c){ c.call(this, f); }) : ''; };

        this.setFile = function (file) {
            if (file.size > maxFileSize){
                this.file = null;
                return;
            }
            this.file = file || null;

        }

        this.sliceFile = function() {
            var chunkSize = 10_000_000;
            var byteIndex = 0;
            var chunks = [];
            var chunksAmount = this.file.size <= chunkSize ? 1 : ((this.file.size / chunkSize) >> 0) + 1;
            if (chunksAmount > maxChunks) {
                chunksAmount = this.file.size/maxChunks;
            }
            for (var i = 0; i < chunksAmount; i++) {
                var byteEnd = Math.ceil((this.file.size / chunksAmount) * (i + 1));
                chunks.push(this.file.slice(byteIndex, byteEnd));
                byteIndex += (byteEnd - byteIndex);
            }
            return chunks;
        };

        this.progress = function (done, total) {
            var percent = (100 * done) / total;
            this.runEvent('progress', {percent: percent, done: done, total: total})
        }

        this.uploadChunks = function (chunks, cb, done) {
            done = done || 0; // in case of synchronized upload
            var len = chunks.length;
            this.uploadChunk(chunks[done], done, len, function (data){
                done++;
                if (done === len) {
                    cb.call(undefined, data);
                    scope.runEvent('progress', {percent: Math.round((100 * done) / len)})
                } else {
                    scope.uploadChunks(chunks, cb, done);
                }
                scope.progress(done, len);
            })
        }

        this.complete = function (data, cb) {
            var params = {
                Bucket: this.multipartData.Bucket,
                Key: this.multipartData.Key,
                UploadId: this.multipartData.UploadId,
                Parts: parts,
                name: scope.file.name,
                folder: getFolder()
            }
            w7.bearerPost(w7.apiurl('/s3-complete-multipart-upload'), params, function (data) {
                 cb.call(undefined, data.data)
            })

        }
        this.upload = function (cb) {
            if(!this.file || uploading) return;
            uploading = true;
            this.create(function (data, err){
                 if (data) {
                     var chunks = scope.sliceFile();
                     scope.uploadChunks(chunks, function (data) {
                         scope.complete(data, function (){
                             if(cb) {
                                 cb.call(undefined, data);
                             }
                             uploading = false;
                         })
                     });
                 } else {
                     console.log(err)
                 }
            })
        }


        var prepareUrl = function (url) {
            if(query) {
                var q = url.indexOf('?') === -1 ? '?' : '';
                var params = [];
                for (var i in query) {
                    params.push(i + '=' + query[i])
                }
                url += (q + params.join('&'));
            }
            return url;
        };

        this.abort = function (cb) {
            if (!sessionId) {
                if (cb) {
                    cb.call(scope);
                }
            } else {
                var url = prepareUrl(w7.apiurl('multipartUpload'));
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (this.readyState === 4 && this.status === 200) {
                        sessionId = null;
                        if (cb) {
                            cb.call(scope)
                        }
                    }
                };
                xhttp.setRequestHeader('Authorization', w7.bearer());
                xhttp.setRequestHeader('Project',  getProject());
                xhttp.open('POST', url, true);
                var formData = new FormData();
                formData.append('abort', sessionId);
                xhttp.send(formData);
            }
        }

        this.create = function (cb) {
            
            w7.bearerPost(w7.apiurl('/s3-create-multipart-upload'), {key: this.file.name, type: this.file.type, folder: getFolder()}, function (data) {
                scope.multipartData = data.data;
                scope.key = data.data.Key;
                cb.call(undefined, data.data, data.err)
            })
        };

        var createId = function(){
            return Math.random().toString(36).substring(7) + new Date().getTime();
        };





        var sign = function (chunkIndex, cb) {
            var obj = {
                key: scope.key,
                UploadId: scope.multipartData.UploadId,
                PartNumber: chunkIndex,
            }
            w7.bearerPost(w7.apiurl('/s3-sign-part'), obj, function (data) {

              cb.call(undefined, data)
            })
        }
        this.uploadChunk = function (chunk, chunkIndex, total, callback) {
            if (chunkIndex === 0) {
                sessionId = null;
            }
            sign(chunkIndex+1, function (data){
                 var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (this.readyState === 4) {

                        if (this.status === 200) {

                             parts.push({
                                ETag: xhttp.getResponseHeader('ETag') || xhttp.getResponseHeader('etag'),
                                PartNumber: chunkIndex+1
                            });
                            callback.call(undefined, xhttp)
                        } else {

                            sessionId = null;
                            wuic.notify(lang(obj.message));
                        }
                    }
                };
                xhttp.open('PUT', data.url, true);
                xhttp.send(chunk);
            });
         }
        this.init = function () {
            this.setFile(file);
            window.addEventListener("beforeunload", function(event) {
                if(sessionId) {
                    event.returnValue = w7.lang('Upload is not finished');
                }
            });
            window.addEventListener("unload", function(event) {
                scope.abort()
            });
        }
        this.init();
    }
    w7.S3Uploader = S3Uploader;
})();
