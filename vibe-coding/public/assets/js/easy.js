/* Interaction fixes without changing the original teacher-facing content. */
(function(){
  'use strict';
  var status=document.createElement('p');status.id='vcActionStatus';status.setAttribute('role','status');status.className='vc-action-status';document.body.append(status);
  document.querySelectorAll('#vcBuilderForm input[type="text"]').forEach(function(el){el.maxLength=120;});
  document.querySelectorAll('#vcBuilderForm input[type="number"]').forEach(function(el){el.step='1';});
  document.querySelector('#vcQrCaption').setAttribute('role','status');
  var note=document.createElement('p');note.textContent='메일 프로그램을 열어 내용을 확인한 뒤 직접 보내 주세요.';document.querySelector('#vcMailSend').before(note);
  var opened=[];
  window.addEventListener('beforeprint',function(){opened=Array.from(document.querySelectorAll('details')).map(function(el){return [el,el.open];});opened.forEach(function(pair){pair[0].open=true;});});
  window.addEventListener('afterprint',function(){opened.forEach(function(pair){pair[0].open=pair[1];});});
})();
