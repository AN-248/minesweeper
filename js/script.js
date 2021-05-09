let width = 0;
let height = 0;
let bomb = 0;
let flag = 0;

let part = 'before'; // before playing after
let clearCount = 0;
let timer;
let $selectedCell = '';

const $startBtn = $('#startBtn');
const $statusF = $('#statusF');
const $timerM = $('#timerM');
const $timerS = $('#timerS');
const $gameBody = $('#gameBody');
const $resultMsg = $('#resultMsg');
const $operation = $('#operation');

$(function () {
    validateNumbers();
    onClickStart();
    onClickNewGame();
});

function validateNumbers() {
    $('#settings input').on('focusout', function () {
        if (isStartBtnEnabled()) {
            $startBtn.prop('disabled', '');
        } else {
            $startBtn.prop('disabled', 'disabled');
        }
    });
}

function onClickStart() {
    $startBtn.on('click', function () {
        initGame();
        $('.before').hide();
        $('.playing').show();
    });
}

function isStartBtnEnabled() {
    setNumbers();
    return width > 0 && height > 0 && bomb > 0 && bomb < width * height;
}

function setNumbers() {
    width = $('#inputW').val();
    height = $('#inputH').val();
    bomb = flag = $('#inputB').val();
}

function initGame() {
    setNumbers();

    $('#statusW').text(width);
    $('#statusH').text(height);
    $statusF.text(flag);
    $timerM.text('00');
    $timerS.text('00');
    clearCount = 0;
    $gameBody.html('');

    let def = new $.Deferred().resolve();
    def.promise().then(function () {
        return buildGameBody();
    }).then(function () {
        return setBombs();
    }).then(function () {
        return countAroundBombs();
    }).done(function () {
        if (window.ontouchstart === null){
            onTouchCell();
            onTouchCancelBtn();
            onTouchFlgBtn();
        } else {
            onClickCell();
        }
    }).fail(function () {
        setNewGame();
    });
}

function buildGameBody() {
    let funcTr = [];
    for (let i = 0; i < height; i++) {
        let func = $gameBody.append('<tr></tr>');
        funcTr.push(func);
    }
    let def1 = $.when.apply($, funcTr);

    for (let i = 0; i < width; i++) {
        def1.then(function () {
            $('#gameBody tr').append('<td></td>');
        })
    }

    let def2 = new $.Deferred();
    def1.done(function () {
        def2.resolve();
    }).fail(function () {
        def2.reject();
    });
    return def2.promise()
}

function setBombs() {
    let funcB = [];
    let bombIndexes = [];
    while (bombIndexes.length < bomb) {
        let n = Math.floor(Math.random() * (width * height))
        if ($.inArray(n, bombIndexes) === -1) {
            let f = $('#gameBody td').eq(n).addClass('is-bomb').html('<span />');
            funcB.push(f);
            bombIndexes.push(n);
        }
    }

    let def1 = $.when.apply($, funcB);
    let def2 = new $.Deferred();
    def1.done(function () {
        def2.resolve();
    }).fail(function () {
        def2.reject();
    });
    return def2.promise()
}

function countAroundBombs() {
    let def1 = new $.Deferred().resolve().promise();

    $('#gameBody td').each(function (index, el) {
        let i = index;
        let e = el;
        def1.then((index = i, el = e) => {
            setBombsCount($(el), getAroundCell(index));
        });
    });

    let def2 = new $.Deferred();
    def1.done(function () {
        def2.resolve();
    }).fail(function () {
        def2.reject();
    });
    return def2.promise()
}

function setBombsCount($el, array) {
    let funcC = []
    let count = 0;
    $.each(array, function(){
        let isBomb = $('#gameBody td').eq(this).hasClass('is-bomb');
        if(isBomb){
            funcC.push(count += 1);
        }
    });

    let def1 = $.when.apply($, funcC);

    def1.then(function (){
        if($el.hasClass('is-bomb')){
            return;
        }

        if (count === 0) {
            $el.addClass('is-blank');
        } else {
            let color = 'color' + String(count);
            $el.addClass(color).text(count);
        }
    });

    let def2 = new $.Deferred();
    def1.done(function () {
        def2.resolve();
    }).fail(function () {
        def2.reject();
    });
    return def2.promise()
}

function getAroundCell(index) {
    let i = Number(index);
    let w = Number(width);
    let h = Number(height);

    let tl = i - w - 1;
    let t = i - w;
    let tr = i - w + 1;
    let l = i - 1;
    let r = i + 1;
    let bl = i + w - 1;
    let b = i + w;
    let br = i + w + 1

    let array = [tl, t, tr, l, r, bl, b, br];
    if (i === 0) {
        array = [r, b, br]
    } else if (i === w - 1) {
        array = [l, bl, b]
    } else if (i === w * (h - 1)) {
        array = [t, tr, r]
    } else if (i === w * h - 1) {
        array = [tl, t, l]
    } else if (i < w - 1) {
        array = [l, r, bl, b, br]
    } else if (i > w * (h - 1)) {
        array = [tl, t, tr, l, r]
    } else if (i % w === 0) {
        array = [t, tr, r, b, br]
    } else if (i % w === w - 1) {
        array = [tl, t, l, bl, b]
    }

    return array;
}

function startTimer() {
    let sec = 0;
    let min = 0;

    timer = setInterval(function(){
        sec += 1;
        if(sec > 59){
            sec = 0;
            min += 1;
        }

        $timerS.text(('0' + sec).slice(-2));
        $timerM.text(('0' + min).slice(-2))
    }, 1000);
}

function onClickCell() {
    $('#gameBody td').on('click contextmenu', function (e) {
        if (part === 'before') {
            part = 'playing';
            startTimer();
        } else if (part === 'after' || $(this).hasClass('is-clear')) {
            return;
        }

        if (e.which === 3 || $(this).hasClass('is-flag')) {
            setFlag($(this));
            return false;
        } else if (e.which === 1) {
            clearCell($(this));
        }
    });
}

function onTouchCell() {
    $('#gameBody td').on('touchend', function () {
        if (part === 'before') {
            part = 'playing';
            startTimer();
        } else if (part === 'after' || $(this).hasClass('is-clear')) {
            return;
        }

        if ($(this).hasClass('is-flag')){
            setFlag($(this));
        } else if ($(this).hasClass('is-selected')){
            hideOperation($(this));
            clearCell($(this));
        } else {
            showOperation($(this))
        }
    });
}

function onTouchFlgBtn() {
    $('#flagBtn').on('touchend', function(){
        setFlag($selectedCell);
        hideOperation($selectedCell);
    });
}

function onTouchCancelBtn(){
    $('#cancelBtn').on('touchend', function(){
        hideOperation($selectedCell);
    });
}

function showOperation($el) {
    if ($selectedCell.length > 0 && $selectedCell !== $el){
        $selectedCell.removeClass('is-selected');
    }
    $selectedCell = $el;
    $el.addClass('is-selected');

    let pos = $el.offset();
    pos.left = (pos.left < 130 ? pos.left + 40 : pos.left - 115);
    $operation.show().offset({
        top: pos.top - 24,
        left: pos.left
    });
}

function hideOperation($el){
    $el.removeClass('is-selected');
    $selectedCell = '';
    $operation.hide();
}

function setFlag($el) {
    if ($el.hasClass('is-flag') && flag <= bomb){
        $el.removeClass('is-flag');
        flag += 1;
    } else if(flag > 0) {
        $el.addClass('is-flag');
        flag -= 1;
    }

    $statusF.text(flag);
}

function clearCell($el) {
    if ($el.hasClass('is-flag')){
       return;
    }

    $el.addClass('is-clear');
    if ($el.hasClass('is-bomb')) {
        return gameOver();
    }

    setProgress();
    if ($el.hasClass('is-blank')) {
        clearBlanks($el);
    }
}

function clearBlanks($el) {
    let index = $('#gameBody td').index($el);
    let array = getAroundCell(index);

    $.each(array, function(){
        let $cell = $('#gameBody td').eq(this);
        if(!$cell.hasClass('is-clear')){
            clearCell($cell);
        }
    });
}

function setProgress() {
    clearCount += 1
    let progress = clearCount / (width * height - bomb) * 100;

    if (100 <= progress) {
        $('body').removeClass().addClass('is-morning');
        gameClear();
    } else if (90 <= progress) {
        $('body').removeClass().addClass('is-earlyMorning');
    } else if (80 <= progress) {
        $('body').removeClass().addClass('is-sunrise');
    } else if (70 <= progress) {
        $('body').removeClass().addClass('is-dayBreak');
    } else if (60 <= progress) {
        $('body').removeClass().addClass('is-lateNight');
    } else if (50 <= progress) {
        $('body').removeClass().addClass('is-midNight');
    } else if (40 <= progress) {
        $('body').removeClass().addClass('is-deepNight');
    } else if (30 <= progress) {
        $('body').removeClass().addClass('is-silentNight');
    } else if (20 <= progress) {
        $('body').addClass('is-night');
    } else {
        $('body').removeClass();
    }
}

function gameOver() {
    finishGame();
    $('#gameBody .is-bomb').each(function(){
        $(this).delay(500).queue(function() {
            $(this).addClass('is-clear');
        })
    });
    $resultMsg.text('GAME OVER').removeClass('is-clear').addClass('is-over');
}

function gameClear() {
    finishGame();
    $('#gameBody .is-bomb').each(function(){
        $(this).addClass('is-safe');
    });

    $resultMsg.text('GAME CLEAR').removeClass('is-over').addClass('is-clear');
}

function finishGame() {
    clearInterval(timer);
    part = 'after'
    $('.after').show();

    $('#gameBody .is-flag').each(function(){
        $(this).removeClass('is-flag');
    });
}

function onClickNewGame() {
    $('#newGameBtn').on('click', function () {
        setNewGame();
    });
}

function setNewGame() {
    part = 'before'
    $('.playing').hide();
    $('.after').hide();
    $('.before').fadeIn();
    $('body').removeClass();
}