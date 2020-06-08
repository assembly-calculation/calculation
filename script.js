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
var fieldsForRope = document.getElementsByClassName('fields-for-rope');
var fieldsForWire = document.getElementsByClassName('fields-for-wire');
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

    for (var i = 0; i <= inputs.length - 1; i++) {
        var isSecondInputRopeInvalid = inputs[i].value.length === 0 && fieldsForRope[0].contains(inputFields[i]) && fieldsForRope[0].dataset.formFieldState === 'show';
        var isSecondInputWireInvalid = inputs[i].value.length === 0 && fieldsForWire[0].contains(inputFields[i]) && fieldsForWire[0].dataset.formFieldState === 'show';
        if ((!form.elements.schema.value.length) || (inputFields[i].classList.contains('is-invalid')) || isSecondInputRopeInvalid || isSecondInputWireInvalid) {
            return false;
        }
    }
    toggleErrorState('none');
    return true;
}

//Функция рассчета

function calcSmeltingIce() {

    // Изначальные значения

    var resultText = '';
    var R_ground = 0.05;
    var R_grounding = 4;

    //Сопротивление системы, приведенное к низшему напряжению 10 кВ:

    var U_average_rated_1 = parseFloat(form.elements['U_average_rated_1'].value),
        U_average_rated_2 = parseFloat(form.elements['U_average_rated_2'].value),
        I_short_circuit = parseFloat(form.elements['I_short_circuit'].value),
        L_l = parseFloat(form.elements.L_l.value),
        X_0 = parseFloat(form.elements.x0.value)*L_l,
        R_0 = parseFloat(form.elements.r0.value)*L_l;

    var X_c = (U_average_rated_2 / ((Math.sqrt(3)) * I_short_circuit)) * (Math.pow((U_average_rated_1 / U_average_rated_2), 2));

    //Сопротивление трансформатора, приведенное к низшему напряжению 10 кВ:

    var U_k = parseFloat(form.elements['U_k'].value),
        S_t_rated = parseFloat(form.elements['S_t_rated'].value);

    var X_tr = (U_k / 100) * (Math.pow(U_average_rated_2, 2) / S_t_rated) * (Math.pow((U_average_rated_1 / U_average_rated_2), 2));

    // Определение схемы плавки голеледа

    var schema = form.elements.schema.value;

    if (parseFloat(schema) < 4) {

    //Ток плавки гололёда на проводе

        var Z_schema_wire;

        switch (schema) {
            case '1' : {
                var Z_l = Math.sqrt(Math.pow(X_0, 2) + Math.pow((R_0 + R_ground + R_grounding), 2));
                Z_schema_wire = (Math.sqrt(3)) * Z_l;
                break;
            }
            case '2' :
            case '3' : {
                var Z_l = Math.sqrt(Math.pow(X_0, 2) + Math.pow(R_0, 2));
                var Z = X_c + Z_l + X_tr;
                parseFloat(schema) === 2
                    ? Z_schema_wire = 2 * Z
                    : Z_schema_wire = (Math.sqrt(3)) * Z;
                break;
            }
            default: break;
        }

        var I_melt_wire = U_average_rated_1 / Z_schema_wire;

    //Расчёт времени плавки гололёда на проводе

        var R_20 = 0.00012;
        var Y = 0.9;
        var d = parseFloat(form.elements.d.value);
        var b = parseFloat(form.elements.b.value);
        var S_st = parseFloat(form.elements.S_st.value);
        var S_al = parseFloat(form.elements.S_al.value);
        var t = parseFloat(form.elements.t.value);
        var V = parseFloat(form.elements.V.value);
        var D = d + b;
        var SUM = (0.462 * 6.1 * S_st + 0.92 * 2.07 * S_al) * (20 + t);

        var T = (36.4 * Y * d * (b + 0.265 * d) * 1000 + 164 * Y * (Math.pow((d * D), 2)) * t + SUM) / ((Math.pow((I_melt_wire * 1000), 2)) * R_20 - (0.09 * D + 1.1 * (Math.sqrt(d * V))) * t);

        T = T / 60;

        resultText += '<div class="result-block__section"><span>Ток плавки гололеда на проводе: </span>' + I_melt_wire.toFixed(3) + ' кA</div>';
        resultText += '<div class="result-block__section"><span>Время плавки гололеда на проводе: </span>' + T.toFixed(3) + ' мин</div>';
    }

    //Ток плавки гололёда на тросе

    var I_melt_rope;
    var Z_equivalent;

    if (parseFloat(schema) >= 4) {
        var X_inductive_out = parseFloat(form.elements['X_inductive_out'].value)*L_l;
        var X_inductive_in = parseFloat(form.elements['X_inductive_in'].value)*L_l;
        var R_rope_t = parseFloat(form.elements['R_rope_active'].value)*L_l;
        var U_ph = (U_average_rated_1 * 1000)/1.05;

        switch (schema) {
            case '4' : {
                Z_equivalent = Math.sqrt(Math.pow((R_rope_t + R_ground * L_l), 2) + Math.pow((X_inductive_out + X_inductive_in), 2)) + R_grounding;
                break;
            }
            case '5' : {
                Z_equivalent = 2 * (Math.sqrt(Math.pow(R_rope_t, 2) + Math.pow((X_inductive_out + X_inductive_in), 2)));
                break;
            }
            case '6' : {
                Z_equivalent = Math.sqrt(Math.pow(((R_rope_t / 2) + (R_ground * L_l)), 2) + Math.pow(((X_inductive_out + X_inductive_in) / 2), 2)) + R_grounding;
                break;
            }
            case '7' : {
                Z_equivalent = 2 * (Math.sqrt(Math.pow(R_rope_t, 2) + Math.pow((X_inductive_out + X_inductive_in), 2)));
                break;
            }
            default:
                break;
        }

        I_melt_rope = U_ph / Z_equivalent;

    //Расчёт времени плавки гололёда на тросе ВЛ

        resultText += '<div class="result-block__section">Ток плавки гололеда на тросе: ' + I_melt_rope.toFixed(3) + ' A</div>';
    }

    //Вывод данных

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
        case 'rope' : {
            fieldsForRope[0].dataset.formFieldState = 'show';
            fieldsForWire[0].dataset.formFieldState = 'hide';
            break
        }
        case 'wire' : {
            fieldsForWire[0].dataset.formFieldState = 'show';
            fieldsForRope[0].dataset.formFieldState = 'hide';
            break
        }
        default: break;
    }
});