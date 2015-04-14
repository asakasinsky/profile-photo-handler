(function (window, $) {
    'use strict';

    // Constants
    var MAX_IMAGE_WIDTH = 8000;
    var MAX_IMAGE_HEIGTH = 4500;

    // Размеры после обрезки
    var NEW_WIDTH = 300;
    var NEW_HEIGTH = 300;

    // Размеры контейнера
    var BOX_WIDTH = 300;
    var BOX_HEIGHT = 300;

    // Включен выбор прямоугольника обрезки
    var AREA_SELECT = true;

    var UPLOAD_URL = '/upload';
    var FILE_TO_UPLOAD;

    var cropData = {};
    var oldImage = {
        src: '',
        width: '',
        height: ''
    };
    var jcropAPI;
    var $uploadPreviewImg;
    var $progressBar;
    var $fileField;

    function _setCropData(c) {
        cropData = c;
    }

    function init($img, uploadUrl, options) {
        var $imgWrap = void(0);
        $img = $img || $('#uploadPreviewImg');
        $imgWrap = $img.parent();

        if (typeof uploadUrl !== 'undefined') {
            UPLOAD_URL = uploadUrl;
        }
        if (typeof options !== 'undefined') {

            NEW_WIDTH = (options.crop && options.crop.width) ?
                                options.crop.width :
                                NEW_WIDTH;
            NEW_HEIGTH = (options.crop && options.crop.height) ?
                                options.crop.height :
                                NEW_HEIGTH;

            BOX_WIDTH = (options.box && options.box.width) ?
                                options.box.width :
                                NEW_WIDTH;
            BOX_HEIGHT = (options.box && options.box.height) ?
                                options.box.height :
                                NEW_HEIGTH;

            AREA_SELECT = (options.areaSelector === false) ?
                                false :
                                (options.areaSelector === void(0) ||
                                        options.areaSelector === true) ?
                                            true :
                                            true;
        }

        $progressBar = $('.photo-pane__progress-bar');
        $fileField = $('#uploadHidden');

        $fileField.change(function (e) {
            handleImage(e.currentTarget.files[0]);
            return false;
        });

        $uploadPreviewImg = $img;
        // Set up the drag/drop zone.
        _initDropZone();
    }

    function openFileDialog() {
        $fileField.trigger('click');
    }

    function resetImage(imgUrl) {
        $('.photo-pane__controls-cmd')
            .removeClass('photo-pane__controls_active');
        $('.photo-pane__controls-loader')
            .addClass('photo-pane__controls_active');

        $progressBar.css({
            width: '0',
            opacity: '0'
        });

        cropData = {};

        if ($uploadPreviewImg.data('Jcrop')) {
            $uploadPreviewImg.data('Jcrop').destroy();
        }

        $uploadPreviewImg.removeAttr('style');
        if (imgUrl !== void(0)) {
            $uploadPreviewImg.attr('src', imgUrl);
        } else {
            $uploadPreviewImg.attr('src', oldImage.src);
            $uploadPreviewImg.css('width', oldImage.width);
            $uploadPreviewImg.css('height', oldImage.height);
        }

        $fileField.replaceWith(
            $fileField = $fileField.clone(true)
        );
    }

    function handleImage(file) {
        FILE_TO_UPLOAD = file;
        if (typeof FILE_TO_UPLOAD === 'undefined' ||
            !FILE_TO_UPLOAD.type.match(/image.*/)) {
            return false;
        }
        if ($uploadPreviewImg.data('Jcrop')) {
            resetImage();
        }
        _readImage(FILE_TO_UPLOAD);
        $('.photo-pane__controls-loader')
            .removeClass('photo-pane__controls_active');
        $('.photo-pane__controls-cmd')
            .addClass('photo-pane__controls_active');
        return true;
    }

    function _readImage(file) {
        var fReader = new FileReader();
        var newImg = new Image();
        var maxw = MAX_IMAGE_WIDTH;
        var maxh = MAX_IMAGE_HEIGTH;

        fReader.onload = function (_file) {
            newImg.onload = function () {
                oldImage.src = $uploadPreviewImg.attr('src');
                oldImage.width = $uploadPreviewImg.css('width');
                oldImage.height = $uploadPreviewImg.css('height');

                if (this.height > maxh ||
                    this.width > maxw) {
                    window.alert('Размеры картинки очень большие');
                    resetImage();
                    return;
                }

                $uploadPreviewImg.attr('src', this.src);

                if ($.Jcrop && AREA_SELECT) {
                    $uploadPreviewImg.css('height', 'auto');
                    $uploadPreviewImg.css('width', 'auto');

                    jcropAPI = $uploadPreviewImg.Jcrop({
                        onChange: _setCropData,
                        onSelect: _setCropData,
                        aspectRatio: 1,
                        minSize: [NEW_WIDTH, NEW_HEIGTH],
                        // maxSize:[300,300],
                        boxWidth: BOX_WIDTH,
                        boxHeight: BOX_HEIGHT,
                    });
                } else {
                    $uploadPreviewImg.css('height', 'auto');
                    $uploadPreviewImg.css(
                        'width',
                        $uploadPreviewImg.parent()[0].offsetWidth + 'px'
                    );
                }

            };
            newImg.onerror = function () {
                console.log('Invalid file type: ' + file.type);
            };
            newImg.src = _file.target.result;
        };
        fReader.readAsDataURL(file);
    }

    function _initDropZone() {
        var $dropZone = $('.photo-pane__drop-area');
        var activeClass = 'photo-pane__drop-area_active';

        $dropZone.on('dragenter', function (e) {
                e.stopPropagation();
                e.preventDefault();
                $(this).addClass(activeClass);
            })
            .on('dragleave', function (e) {
                e.stopPropagation();
                e.preventDefault();
                $(this).removeClass(activeClass);
            })
            .on('drop', function (e) {
                var msg = 'file ready for upload!';
                e.stopPropagation();
                e.preventDefault();
                $(this).removeClass(activeClass);
                if (!handleImage(e.originalEvent.dataTransfer.files[0])) {
                    msg = 'this file is not an image.';
                    console.log('this file is not an image.');
                }
            });

        // If the files are dropped outside of the drop zone,
        // the browser will redirect to show the files in the window.
        // To avoid that we can prevent the 'drop' event on the document.
        function stopDefault(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        $(document).on('dragenter', stopDefault);
        $(document).on('dragover', stopDefault);
        $(document).on('drop', stopDefault);
    }

    function uploadImage(callback) {
        // Gray out the form.
        $('.photo-pane__control').attr('disabled', 'disabled');
        $progressBar.css({
            width: '0',
            opacity: '1'
        });
        var fd = new FormData();
        // Attach the files.
        fd.append('file', FILE_TO_UPLOAD);
        // Inform the back-end that we're doing this over ajax.
        fd.append('__ajax', 'true');
        fd.append(
            '__crop',
            JSON.stringify({
                h: cropData.h,
                w: cropData.w,
                x1: cropData.x,
                x2: cropData.x2,
                y1: cropData.y,
                y2: cropData.y2,
            })
        );
        fd.append(
            '__resize',
            JSON.stringify({
                width: NEW_WIDTH,
                height: NEW_HEIGTH,
            })
        );

        $.ajax({
            xhr: function () {
                var xhrobj = $.ajaxSettings.xhr();
                if (xhrobj.upload) {
                    xhrobj.upload.addEventListener(
                        'progress',
                        function (event) {
                            var percent = 0;
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }
                            // Set the progress bar.
                            $progressBar.css({
                                width: percent + '%'
                            });
                        },
                        false
                    );
                }
                return xhrobj;
            },
            url: UPLOAD_URL,
            // The HTTP method to use for the request
            // (e.g. "POST", "GET", "PUT"). (version added: 1.9.0)
            method: 'POST',
            // An alias for method. You should use type if you're using
            // versions of jQuery prior to 1.9.0.
            type: 'POST',
            contentType: false,
            processData: false,
            cache: false,
            data: fd,
            success: function (data) {
                $progressBar.css({
                    width: '100%'
                });
                if (typeof data !== 'object') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        window.alert(
                            'Ошибка загрузки. неверный ответ сервера'
                        );
                    }

                }
                $('.photo-pane__control').removeAttr('disabled');
                // How'd it go?
                if (data.status === 'error') {
                    window.alert('Ошибка загрузки');
                    return;
                } else {
                    resetImage(
                        data.uploadedFile
                    );
                    if (typeof callback === 'function') {
                        callback(data);
                    }
                    return;
                }
            },
        });
    }

    window.PhotoHandler = {
        init: init,
        openFile: openFileDialog,
        reset: resetImage,
        upload: uploadImage,
    };

})(window, $);
