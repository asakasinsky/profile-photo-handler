(function ($) {
    'use strict';

    function enablePhotoLoader() {

        if ($('#profileImage').val()) {
            $('#uploadPreviewImg').attr(
                'src',
                $('#profileImage').val()
            );
        } else {
            $('#uploadPreviewImg').attr(
                'src',
                'http://placehold.it/300x300'
            );
        }

        window.PhotoHandler.init(
            $('#uploadPreviewImg'),
            'http://site.ru/upload.php', {
                crop: {
                    width: 300,
                    height: 300,
                },
                box: {
                    width: 276,
                    height: 976,
                },
                areaSelector: false
            }
        );

        $('#uploadFromDisk').click(function () {
            window.PhotoHandler.openFile();
            return false;
        });
        $('#uploadFromCamera').click(function () {
            window.alert([
                'Эта функция проверяется на доступность в браузерах. ',
                'Пока недоступна'
            ].join(''));
            return false;
        });
        $('#uploadReset').click(function () {
            window.PhotoHandler.reset();
            return false;
        });
        $('#uploadGo').click(function () {
            window.PhotoHandler.upload(
                function (data) {
                    $('#profileImage').val(data.uploadedFile);
                    console.log(data);
                }
            );
            return false;
        });
    }

    function init() {
        enablePhotoLoader();
    }

    init();
}(jQuery));
