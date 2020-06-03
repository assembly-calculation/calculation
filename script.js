//DOM elements

var form = document.getElementById('form-data');
var popup = document.getElementById('form-info');
var resultBlock = document.getElementById('form-results');
var resultBlockDesc = document.getElementById('form-results-desc');
var resetBtn = document.getElementById('form-button-reset');
var successBtn = document.getElementById('form-button-success');
var infoBtn = document.getElementById('form-button-info');
var closeBtn = document.getElementById('form-button-close');
var error = document.getElementById('form-main-error');
var inputFields = document.getElementsByClassName('mdl-textfield');
var inputs = document.getElementsByClassName('mdl-textfield__input');

//handlers

function calcForm() {
    isInputValid()
        ? calcSmeltingIce()
        : toggleErrorState('block')
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

function isInputValid() {
    if (!form.elements.wires.value.length || !form.elements.cable.value.length) {
        return false
    }

    for (var i = 0; i <= inputs.length - 1; i++) {
        if ((inputFields[i].classList.contains('is-invalid')) || (inputs[i].value.length === 0)) {
            return false;
        }
    }
    toggleErrorState('none');
    return true;
}

function calcSmeltingIce() {
    //Сопротивление системы, приведенное к напряжению 10 кВ:
    var U_avarage_rated_1 = 10.5,
        U_avarage_rated_2 = 115,
        I_short_circuit = 24.5;

    var X_c = (U_avarage_rated_2 / ((Math.sqrt(3)) * I_short_circuit)) * (Math.pow((U_avarage_rated_1 / U_avarage_rated_2), 2));

    //Сопротивление трансформатора, приведенное к напряжению 10 кВ:

    var U_k = 10.5,
        S_t_rated = 63;

    var X_tr = (U_k / 100) * (Math.pow((U_avarage_rated_2) / S_t_rated), 2) * (Math.pow((U_avarage_rated_1 / U_avarage_rated_2), 2));

    //Сопротивление
    var Z_l = form.elements.I_l.value * (Math.sqrt(Math.pow(form.elements.x0.value, 2) + Math.pow(form.elements.r0.value, 2)));

    //Ток плавки гололёда

    var I_m = U_avarage_rated_1 / ((Math.sqrt(3)) * (X_c + Z_l + X_tr));

    //Время плавки гололёда
    var R_20 = 0.00012;
    var Y = 0.9;
    var D = form.elements.d.value + form.elements.b.value;
    var SUM = (0.462 * 6.1 * form.elements.S_st.value + 0.92 * 2.07 * form.elements.S_al.value) * (20 + form.elements.t.value);

    var T = (36.4 * Y * form.elements.d.value * (form.elements.b.value + 0.265 * form.elements.d.value) * 1000 + 164 * Y * (Math.pow((form.elements.d.value * D), 2)) * form.elements.t.value + SUM) / ((Math.pow((I_m * 1000), 2)) * R_20 - (0.09 * D + 1.1 * (Math.sqrt(form.elements.d.value * form.elements.V.value))) * form.elements.t.value);

    T = T / 60;

    //Расчёт тока и времени плавки гололёда на тросе ВЛ
    //Ток плавки гололёда

    var U_ph = 10000,
        R_g = 0.05,
        R_t = 4.05 * form.elements.I_l.value,
        X_in = 2.07 * form.elements.I_l.value,
        X_out = 0.77 * form.elements.I_l.value;

    var I_m2 = U_ph / (Math.sqrt(3 * ((Math.pow((R_t + R_g), 2)) + (Math.pow((X_in + X_out), 2)))));
    resultBlockDesc.innerHTML = 'Сопротивление системы: ' + X_c.toFixed(3) + ' Ом <br>' + 'Сопротивление трансформатора: ' + X_tr.toFixed(3) + ' Ом <br>' + 'Сопротивление линии: ' + Z_l.toFixed(3) + ' Ом <br>' + 'Ток плавки гололёда на проводе: ' + I_m2.toFixed(3) + ' A <br>' + 'Время плавки гололёда: ' + T.toFixed(3) + ' мин <br>' + 'Ток плавки гололёда на тросе: ' + I_m2.toFixed(3) + ' A <br>';
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
infoBtn && infoBtn.addEventListener('click', function () {
    togglePopupState('open')
});
closeBtn && closeBtn.addEventListener('click', function () {
    togglePopupState('close')
});
