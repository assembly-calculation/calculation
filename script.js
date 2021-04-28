//DOM elements

var form = document.getElementById('form-data');
var popup = document.getElementById('form-info');
var resultBlock = document.getElementById('form-results');
var resultBlockHeader = document.getElementById('form-results-header');
var resultBlockDesc = document.getElementById('form-results-desc');
var resetBtn = document.getElementById('form-button-reset');
var successBtn = document.getElementById('form-button-success');
var infoBtn = document.getElementById('form-button-info');
var closeBtn = document.getElementById('form-button-close');
var error = document.getElementById('form-main-error');
var fieldsForRope = document.getElementsByClassName('fields-for-rope');
var fieldsForWire = document.getElementsByClassName('fields-for-wire');
var inputFields = document.getElementsByClassName('mdl-textfield');
var inputs = document.getElementsByClassName('mdl-textfield__input');
var selects = document.getElementsByClassName('form-select');

//handlers


function isInputValid() {
    for (var i = 0; i <= inputs.length - 1; i++) {
        var isSecondInputRopeInvalid = inputs[i].value.length === 0 && fieldsForRope[0].contains(inputFields[i]) && fieldsForRope[0].dataset.formFieldState === 'show';
        var isSecondInputWireInvalid = inputs[i].value.length === 0 && fieldsForWire[0].contains(inputFields[i]) && fieldsForWire[0].dataset.formFieldState === 'show';
        if ((!form.elements.schema.value.length) || (inputFields[i].classList.contains('is-invalid')) || isSecondInputRopeInvalid || isSecondInputWireInvalid) {
            return false;
        }
    }

    return true;
}

function isSelectValid() {
    for (var i = 0; i <= selects.length - 1; i++) {
        if (!selects[i].value.length) {
            return false;
        }
    }
    return true;
}

function isFormValid() {
    return isInputValid() && isSelectValid();
}

function calcForm() {
    if (isFormValid()) {
        toggleErrorState('none');
        calcCablePullingForces();
    } else {
        toggleErrorState('block');
    }
}

function toggleErrorState(state) {
    error.style.display = state;
}

function resetForm() {
    if (inputFields.length) {
        for (var i = 0; i <= inputFields.length - 1; i++) {
            inputFields[i].className = 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label';
        }
    }
    resultBlock.classList.remove('show');
    toggleErrorState('none');
}

//Функция рассчета

function calcCablePullingForces() {

    // Изначальные значения

    var resultText = '';
    var R_dop_kof = 15;
    var g = 9.81;
    var GradToRadian = Math.PI / 180;

    var drumNumbers = {
        '8': {
            D_sh: 800,
            l_sh: 230,
            d_sh: 450
        },
        '8a': {
            D_sh: 800,
            l_sh: 400,
            d_sh: 450
        },
        '8b': {
            D_sh: 800,
            l_sh: 500,
            d_sh: 450
        },
        '10': {
            D_sh: 1000,
            l_sh: 500,
            d_sh: 545
        },
        '12': {
            D_sh: 1220,
            l_sh: 500,
            d_sh: 650
        },
        '12a': {
            D_sh: 1220,
            l_sh: 710,
            d_sh: 650
        },
        '14': {
            D_sh: 1400,
            l_sh: 710,
            d_sh: 750
        },
        '14a': {
            D_sh: 1400,
            l_sh: 500,
            d_sh: 900
        },
        '14b': {
            D_sh: 1400,
            l_sh: 600,
            d_sh: 1000
        }
    };

    var S_cab = parseFloat(form.elements['S_cab'].value),
        D_cab = parseFloat(form.elements['D_cab'].value),
        M_cab = parseFloat(form.elements['M_cab'].value),
        L_cab = parseFloat(form.elements['L_cab'].value),
        F_prev = parseFloat(form.elements['F_prev'].value),
        Z_method = parseFloat(form.elements['Z_method'].value),
        Z_material = parseFloat(form.elements['Z_material'].value),
        D_n = parseFloat(form.elements['D_n'].value),
        drum_number = parseFloat(form.elements['drum_number'].value),
        Bet,
        Alf,
        Rad_izg;

    //Общие рассчеты для проектного кабеля

    var F_dop = 50 * S_cab;
    var R_dop = D_cab * R_dop_kof;
    var G = M_cab * g;

    // Расчет усилий тяжеления кабеля взависимости от типа участка трассы

    var schema = form.elements.schema.value;
    var F;
    var F_r;

    switch (schema) {
        case 'ascent':
            Bet = parseFloat(form.elements['Bet'].value) * GradToRadian;
            F = F_prev + G * L_cab * (Z_method * Math.cos(Bet) + Math.sin(Bet));
            break;
        case 'descent':
            Bet = parseFloat(form.elements['Bet'].value) * GradToRadian;
            F = F_prev + G * L_cab * (Z_method * Math.cos(Bet) - Math.sin(Bet));
            break;
        case 'with-twist':
            Alf = parseFloat(form.elements['Alf'].value);
            F = F_prev * (Math.E ** (Alf * GradToRadian * Z_method));
            Rad_izg = parseFloat(form.elements['Rad_izg'].value);
            F_r = (F * Math.sin((Alf/2) * GradToRadian) ) / (Rad_izg * Math.PI * (Alf / 360))
            break;
        case 'default':
            F = F_prev + G * L_cab * Z_method;
            break;

        default: break;
    }

    //Расчет длины намотанного кабеля

    var {D_sh, d_sh, l_sh} = drumNumbers[drum_number];

    var L_n = Math.PI * l_sh * ((D_n ** 2 - d_sh ** 2) / (1000 * 4 * D_cab ** 2));

    var L_max = Math.PI * l_sh * ((((D_sh - 100)**2 - d_sh**2) * 0.85)/(1000 * 4 * D_cab ** 2));

    //Вывод данных
    F = parseInt(F);
    F_dop = parseInt(F_dop);
    resultText += '<div class="result-block__section">Усилие тяжения на выходе из трассы для проектной кабельной линии: ' + F + ' H/м</div>';
    resultText += '<div class="result-block__section">Допустимое значение усилия тяжения на выходе из трассы: ' + F_dop + ' H/м</div>';
    resultText += '<div class="result-block__section">Длина намотанного на барабан кабеля: ' + L_n.toFixed(2) + ' м</div>';
    resultText += '<div class="result-block__section">Максимальная длина намотки кабеля : ' + L_max.toFixed(2) + ' м</div>';

    if (F_r) {
        resultText += '<div class="result-block__section">Радиальное давление: ' + F_r.toFixed(0) + ' H/м</div>';
    }

    resultBlockHeader.classList.add((F > 0 && (F_dop > F)) ? "status-success" : "status-error");
    resultBlockDesc.innerHTML = resultText;
    resultBlock.classList.add('show');
}

function togglePopupState(state) {
    switch (state) {
        case 'open': {
            popup.className = 'form-popup zoomIn animated';
            popup.style.zIndex = '2';
            break;
        }
        case 'close': {
            popup.className = 'form-popup zoomOut animated';
            popup.style.zIndex = '-1';
            break;
        }
        default:
            break;
    }
}

//events

successBtn && successBtn.addEventListener('click', calcForm);
resetBtn && resetBtn.addEventListener('click', resetForm);
infoBtn && infoBtn.addEventListener('click', function () {togglePopupState('open')});
closeBtn && closeBtn.addEventListener('click', function () {togglePopupState('close')});
form && form.addEventListener('change', function (e) {
    switch (e.target.dataset.schemaType) {
        case 'with-twist' : {
            fieldsForRope[0].dataset.formFieldState = 'show';
            fieldsForWire[0].dataset.formFieldState = 'hide';
            break
        }
        case 'ascent-descent' : {
            fieldsForWire[0].dataset.formFieldState = 'show';
            fieldsForRope[0].dataset.formFieldState = 'hide';
            break
        }
        case 'default' : {
            fieldsForWire[0].dataset.formFieldState = 'hide';
            fieldsForRope[0].dataset.formFieldState = 'hide';
            break
        }
        default: break;
    }
});