interface FormUpdater {
  setFormTitle: (title: string) => void;
  setFormDescription: (description: string) => void;
  setQuestions: (questions: any[]) => void;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const talk_to_assistant = async (
  current_form_id: string,
  formUpdater?: FormUpdater
) => {
  console.log('🚀 Talk to assistant called with form ID:', current_form_id);
  console.log('📡 Backend URL:', BACKEND_BASE_URL);

  try {
    console.log('🔄 Making request to:', `${BACKEND_BASE_URL}/api/forms/assist`);
    const res = await fetch(`${BACKEND_BASE_URL}/api/forms/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_form_id }),
    });
    
    console.log('📊 Response status:', res.status);
    console.log('📊 Response OK:', res.ok);
    
    if (!res.ok) {
      throw new Error(`Assist request failed: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('📝 Response data:', data);

    if (formUpdater) {
      console.log('🔄 Updating form with:');
      console.log('   Title:', data.title);
      console.log('   Description:', data.description);
      console.log('   Questions count:', data.questions?.length);
      
      formUpdater.setFormTitle(data.title);
      formUpdater.setFormDescription(data.description);
      formUpdater.setQuestions(data.questions);
      
      console.log('✅ Form updated successfully!');
    }
  } catch (err) {
    console.error('❌ talk_to_assistant error:', err);
  }
};