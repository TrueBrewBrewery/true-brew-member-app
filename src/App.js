// True Brew Member Card Web App Prototype (React + Supabase)

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import './App.css'; // Optional: create this if you want additional styling overrides

const supabaseUrl = 'https://olppqgvwgabgtophqwuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scHBxZ3Z3Z2FiZ3RvcGhxd3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDY4MzksImV4cCI6MjA2MzgyMjgzOX0.hD8jsEWDXuLIp8PDKVvQA0QRvCNu741nYFmcnzKAWT8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [specials, setSpecials] = useState([]);
  const [members, setMembers] = useState([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    mobile: '',
    new_special: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });
  }, []);

  async function fetchProfile(user) {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);

    const { data: specials } = await supabase.from('specials').select('*');
    setSpecials(specials);

    if (data?.is_admin) {
      const { data: allMembers } = await supabase.from('members').select('*');
      setMembers(allMembers);
    }
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });
    if (error) setError(error.message);
  }

  async function handleSignUp() {
    const { email, password, first_name, last_name, mobile } = formData;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return setError(signUpError.message);
    if (signUpData.user) {
      const { error: insertError } = await supabase.from('members').insert([
        {
          user_id: signUpData.user.id,
          email,
          first_name,
          last_name,
          mobile,
          is_admin: false
        }
      ]);
      if (insertError) setError(insertError.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function handleAddSpecial() {
    if (!formData.new_special) return;
    const { error } = await supabase.from('specials').insert([{ description: formData.new_special }]);
    if (!error) {
      setFormData({ ...formData, new_special: '' });
      const { data: updatedSpecials } = await supabase.from('specials').select('*');
      setSpecials(updatedSpecials);
    } else {
      setError(error.message);
    }
  }

  async function handleDeleteSpecial(id) {
    const { error } = await supabase.from('specials').delete().eq('id', id);
    if (!error) {
      const { data: updatedSpecials } = await supabase.from('specials').select('*');
      setSpecials(updatedSpecials);
    } else {
      setError(error.message);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const Container = ({ children }) => (
  <div className="relative">
    <div className="flex justify-center pt-6">
          </div>
    <div className="bg-white border border-gray-300 shadow-xl rounded-2xl p-6 max-w-md mx-auto mt-6">
      {children}
    </div>
  </div>
);

  if (!session) return (
    <Container>
      <img src="/true-brew-logo-transparency.png" alt="True Brew" className="mx-auto mb-6 w-[30vw] max-w-xs drop-shadow-md" />
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        {isSignUp ? 'Join True Brew Rewards' : 'True Brew Member Login'}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
      <div className="space-y-3">
        <Input name="email" placeholder="Email" onChange={handleChange} />
        <Input name="password" placeholder="Password" type="password" onChange={handleChange} />
        {isSignUp && (
          <>
            <Input name="first_name" placeholder="First Name" onChange={handleChange} />
            <Input name="last_name" placeholder="Last Name" onChange={handleChange} />
            <Input name="mobile" placeholder="Mobile Number" onChange={handleChange} />
          </>
        )}
        <Button className="w-full text-lg" onClick={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp ? 'Sign Up' : 'Log In'}
        </Button>
        <p className="text-sm text-center text-gray-600">
          {isSignUp ? 'Already a member?' : "Don't have an account?"}{' '}
          <button className="text-blue-600 underline" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </Container>
  );

  return (
    <Container>
      <img src="/true-brew-logo-transparency.png" alt="True Brew" className="mx-auto mb-6 w-32 drop-shadow-md" />
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Welcome, {profile?.first_name}!</h2>
      <div className="space-y-1 text-center text-gray-700">
        <p><strong>Email:</strong> {profile?.email}</p>
        <p><strong>Mobile:</strong> {profile?.mobile}</p>
      </div>
      <Button className="mt-4 w-full" onClick={handleLogout}>Log Out</Button>

      <h3 className="mt-8 text-lg font-semibold text-gray-800">Current Specials</h3>
      <ul className="mt-3 space-y-2">
        {specials.map(s => (
          <li key={s.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded shadow-sm">
            <span>{s.description}</span>
            {profile?.is_admin && (
              <Button variant="destructive" size="sm" onClick={() => handleDeleteSpecial(s.id)}>Delete</Button>
            )}
          </li>
        ))}
      </ul>

      {profile?.is_admin && (
        <div className="mt-8">
          <h4 className="font-semibold text-gray-700">Add New Special</h4>
          <Input
            className="mt-2"
            name="new_special"
            placeholder="Enter new special"
            value={formData.new_special}
            onChange={handleChange}
          />
          <Button className="mt-2" onClick={handleAddSpecial}>Add Special</Button>

          <h4 className="mt-6 font-semibold text-gray-700">Member Directory</h4>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
            {members.map(m => (
              <li key={m.user_id}>{m.first_name} {m.last_name} - {m.email} - {m.mobile}</li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}

export default App;
