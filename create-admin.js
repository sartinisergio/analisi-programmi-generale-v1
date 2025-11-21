import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdcqrmonyvcogxobdiwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY3FybW9ueXZjb2d4b2JkaXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDI1MjQsImV4cCI6MjA3OTIxODUyNH0.MZCM5gq4mxorqtxXEgr37eEJHsyWcVL6yEiOaIJ5RG4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'pinciorespoglio@gmail.com';
  const password = 'Admin123!';

  console.log('Creazione utente amministratore...');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (authError) {
    console.error('Errore creazione utente:', authError.message);
    return;
  }

  console.log('Utente creato con successo!');
  console.log('User ID:', authData.user.id);

  // Aggiungi profilo con ruolo super_admin
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email,
      role: 'super_admin',
    });

  if (profileError) {
    console.error('Errore creazione profilo:', profileError.message);
    return;
  }

  console.log('\n✅ AMMINISTRATORE CREATO CON SUCCESSO!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\nPuoi ora accedere all\'applicazione con queste credenziali.');
}

createAdmin();
