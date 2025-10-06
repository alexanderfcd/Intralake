(function (){
    var Uploader = function (file, tofolder, toproject, query) {

        var progress = 0;
        var scope = this;

        var sessionId = null;
        var sessionProject = null;
        var sessionFolder = null;


        var uploading = false;


        var _events = {};
        this.on = function (e, f) { _events[e] ? _events[e].push(f) : (_events[e] = [f]); return this; };
        this.runEvent = function (e, f) { _events[e] ? _events[e].forEach(function (c){ c.call(this, f); }) : ''; return this; };

        this.progress = function (val) {
            if(val === undefined) return progress;
            progress = val;
        };

        this.setFile = function (file) {
            this.file = file || null;
            this.progress(0);
        }

        this.sliceFile = function() {
            var chunkSize = 1000000;
            var byteIndex = 0;
            var chunks = [];
            var chunksAmount = this.file.size <= chunkSize ? 1 : ((this.file.size / chunkSize) >> 0) + 1;
            for (var i = 0; i < chunksAmount; i++) {
                var byteEnd = Math.ceil((this.file.size / chunksAmount) * (i + 1));
                chunks.push(this.file.slice(byteIndex, byteEnd));
                byteIndex += (byteEnd - byteIndex);
            }
            return chunks;
        };



        this.uploadChunks = function (chunks, cb, done, onChunk) {
            done = done || 0; // in case of synced upload
            var len = chunks.length;
            this.uploadChunk(chunks[done], done, len, function (data){
                done++;
                if (done === len) {
                    cb.call(undefined, data);
                } else {
                    if(onChunk) {
                        onChunk.call(undefined, {
                            data, done, chunks,
                            percent: Math.round((100 * done) / chunks.length)
                        })
                    }
                    scope.uploadChunks(chunks, cb, done, onChunk);
                }
            })
        }

        this.upload = function (cb, cbChunk) {
            if(!this.file || uploading) return;
            uploading = true;
            this.abort(function (){
                var chunks = this.sliceFile();
                this.uploadChunks(chunks, function (data) {
                    if(cb) {
                        cb.call(undefined, data);
                    }
                    uploading = false;
                }, undefined, function (chunkData){
                    if(cbChunk) {
                        cbChunk.call(undefined, chunkData)
                    }
                });
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

        this.uploadChunk = function (chunk, chunkIndex, total, callback) {
            if (chunkIndex === 0) {
                sessionId = null;
                sessionProject = toproject || getProject();
                sessionFolder = tofolder || getFolder();
            }
            var url = prepareUrl(w7.apiurl('multipartUpload'));
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    var obj = JSON.parse(this.responseText);
                    if (this.status === 200) {
                        scope.progress(Math.ceil(scope.progress() + 100/100));
                        if (obj.id) {
                            sessionId = obj.id;
                        }
                        if (obj.complete === true) {
                            sessionId = null;
                            sessionProject = null;
                            sessionFolder = null;
                        }

                        callback.call(undefined, obj)
                    } else {
                        scope.progress(0);
                        sessionId = null;
                        sessionProject = null;
                        sessionFolder = null;
                        wuic.notify(lang(obj.message));
                    }
                }
            };
            xhttp.open('POST', url, true);
            xhttp.setRequestHeader('Authorization', w7.bearer());
            xhttp.setRequestHeader('Project',  getProject());


            var formData = new FormData();
            formData.append('data', chunk);
            formData.append('name', this.file.name);
            formData.append('type', this.file.type);
            formData.append('size', this.file.size);
            formData.append('index', chunkIndex);
            formData.append('total', total);
            formData.append('project', sessionProject);
            var folder = sessionFolder;
            if (folder) {
                formData.append('folder', folder);
            }

            if (sessionId) {
                formData.append('id', sessionId);
            }
            xhttp.send(formData);
            return xhttp;
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
    w7.Uploader = Uploader;
})();
