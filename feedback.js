/* Feedback stays in the form until the server confirms receipt. */
(function () {
  'use strict';
  const form = document.querySelector('#feedbackForm');
  const fields = document.querySelector('#feedbackFields');
  const message = document.querySelector('#feedbackMessage');
  const status = document.querySelector('#feedbackStatus');
  const button = document.querySelector('#sendFeedback');
  let sending = false;
  window.PlayerFeedback = {
    open(details) {
      if (!message.value && !sending) document.querySelector('#feedbackDetails').value = details || '';
      document.querySelector('#feedbackModal').hidden = false;
      if (form.hasAttribute('data-netlify')) {
        status.textContent = 'Feedback is temporarily unavailable. Please come back later.';
        status.className = 'feedback-error';
      }
      if (!sending) document.querySelector('#feedbackCategory').focus();
    }
  };
  message.addEventListener('input', () => message.setCustomValidity(''));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (form.hasAttribute('data-netlify')) {
      status.textContent = 'Feedback is temporarily unavailable. Your message has not been sent.';
      status.className = 'feedback-error';
      return;
    }
    message.setCustomValidity(message.value.trim().length >= 5 ? '' : 'Please write at least 5 characters.');
    if (!form.reportValidity()) return;
    const body = new URLSearchParams(new FormData(form));
    body.set('message', message.value.trim());
    sending = true; fields.disabled = true; button.textContent = 'Sending…';
    status.textContent = 'Sending your feedback…'; status.className = '';
    try {
      const response = await fetch(form.getAttribute('action'), {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error('Submission failed');
      if (form.hasAttribute('data-feedback-api') && (await response.json()).ok !== true) {
        throw new Error('Submission not confirmed');
      }
      form.reset();
      status.textContent = 'Thanks! Your feedback has been sent.';
      status.className = 'feedback-success';
    } catch (error) {
      status.textContent = 'Could not send your feedback. Your message is still here — please try again.';
      status.className = 'feedback-error';
    } finally {
      sending = false; fields.disabled = false; button.textContent = 'Send feedback';
    }
  });
})();
