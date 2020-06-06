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
    if (!form.elements.wire.value.length && !form.elements.rope.value.length) {
        return false
    }

    for (var i = 0; i <= inputs.length - 1; i++) {
        if ((inputFields[i].classList.contains('is-invalid')) || (inputs[i].value.length === 0 && fieldsForRope.contains(inputFields[i]) && fieldsForRope.dataset.formFieldState === 'show')) {
                return false;
        }
    }
    toggleErrorState('none');
    return true;
}

//Функция рассчета

function calcSmeltingIce() {
    var resultText = '';

    //Сопротивление системы, приведенное к низшему напряжению 10 кВ:

    var U_average_rated_1 = form.elements['U_average_rated_1'].value,
        U_average_rated_2 = form.elements['U_average_rated_2'].value,
        I_short_circuit = form.elements['I_short_circuit'].value,
        X_0 = form.elements.x0.value,
        R_0 = form.elements.r0.value,
        I_l = form.elements.I_l.value;

    var X_c = (U_average_rated_2 / ((Math.sqrt(3)) * I_short_circuit)) * (Math.pow((U_average_rated_1 / U_average_rated_2), 2));

    //Сопротивление трансформатора, приведенное к низшему напряжению 10 кВ:

    var U_k = form.elements['U_k'].value,
        S_t_rated = form.elements['S_t_rated'].value;

    var X_tr = (U_k / 100) * (Math.pow(U_average_rated_2, 2) / S_t_rated) * (Math.pow((U_average_rated_1 / U_average_rated_2), 2));

    //Сопротивления

    var Z_0 = Math.sqrt(Math.pow(X_0, 2) + Math.pow(R_0, 2));
    var Z_l = form.elements.I_l.value * Z_0;
    var Z = X_c + Z_l + X_tr;

    //Ток плавки гололёда на проводе

    var schema_wire = form.elements.wire.value;

    if (schema_wire.length) {
        var Z_schema_wire;

        switch (schema_wire) {
            case '1' : {
                Z_schema_wire = (Math.sqrt(3)) * Z_0;
            }
            case '2' : {
                Z_schema_wire = 2 * Z;
            }
            case '3' : {
                Z_schema_wire = (Math.sqrt(3)) * Z;
            }
            default:
                break;
        }

        var I_melt_wire = U_average_rated_1 / Z_schema_wire;

        resultText += '<div class="result-block__section"><span>Ток плавки голоеда на проводе: </span>' + I_melt_wire.toFixed(3) + '</div>';
    }

    //Ток плавки гололёда на тросе

    var schema_rope = form.elements.rope.value;
    var I_melt_rope;
    var Z_equivalent;

    if (schema_rope.length) {
        var R_ground = 0.05;
        var R_grounding = 4;// to-do 4 Ом сопротивление заземления ?
        var X_inductive_out = form.elements['X_inductive_out'].value;
        var X_inductive_in = form.elements['X_inductive_in'].value;
        var R_rope_t = R_0; //to-do я прав или нет?

        switch (schema_rope) {
            case '1' : {
                Z_equivalent = Math.sqrt(Math.pow((R_rope_t + R_ground * I_l), 2) + Math.pow((X_inductive_out + X_inductive_in), 2));
                I_melt_rope = U_average_rated_1 / (Z_equivalent + R_grounding);
                break;
            }
            case '2' : {
                Z_equivalent = 2 * (Math.sqrt(Math.pow(R_rope_t, 2) + Math.pow((X_inductive_out + X_inductive_in), 2)));
                I_melt_rope = U_average_rated_1 / Z_equivalent;
                break;
            }
            case '3' : {
                Z_equivalent = Math.sqrt(Math.pow((R_rope_t / 2 + R_ground * I_l), 2) + Math.pow((X_inductive_out / 2 + X_inductive_in / 2), 2));
                I_melt_rope = U_average_rated_1 / (Z_equivalent + R_grounding);
                break;
            }
            case '4' : {
                Z_equivalent = 2 * (Math.sqrt(Math.pow(R_rope_t, 2) + Math.pow((X_inductive_out + X_inductive_in), 2)));
                I_melt_rope = U_average_rated_1 / Z_equivalent;
                break;
            }
            default:
                break;
        }

        resultText += '<div class="result-block__section">Ток плавки голоеда на тросе: ' + I_melt_rope.toFixed(3) + '</div>';
    }


    //Время плавки гололёда

    var R_20 = 0.00012;
    var Y = 0.9;
    var d = form.elements.d.value;
    var b = form.elements.b.value;
    var S_st = form.elements.S_st.value;
    var S_al = form.elements.S_al.value;
    var t = form.elements.t.value;
    var V = form.elements.V.value;
    var D = d + b;
    var SUM = (0.462 * 6.1 * S_st + 0.92 * 2.07 * S_al) * (20 + t);

    var I_m = I_melt_wire; //to-do  временно

    var T = (36.4 * Y * d * (b + 0.265 * d) * 1000 + 164 * Y * (Math.pow((d * D), 2)) * t + SUM) / ((Math.pow((I_m * 1000), 2)) * R_20 - (0.09 * D + 1.1 * (Math.sqrt(d * V))) * t);

    T = T / 60;

    //Расчёт тока и времени плавки гололёда на тросе ВЛ
    //Ток плавки гололёда

    var U_ph = 10000,
        R_g = 0.05,
        R_t = 4.05 * I_l,
        X_in = 2.07 * I_l,
        X_out = 0.77 * I_l;

    var I_m2 = U_ph / (Math.sqrt(3 * ((Math.pow((R_t + R_g), 2)) + (Math.pow((X_in + X_out), 2)))));

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
infoBtn && infoBtn.addEventListener('click', function () {
    togglePopupState('open')
});
closeBtn && closeBtn.addEventListener('click', function () {
    togglePopupState('close')
});
form && form.addEventListener('change', function(e) {
    console.log(e.target.name);
    console.log(fieldsForRope[0]);
    if (fieldsForRope[0] && e.target.name === 'rope') {
        fieldsForRope[0].dataset.formFieldState = 'show';
    }
});