import React, { useEffect, useState } from 'react';
import { getProfiles, updateProfile, deleteProfile } from '../../lib/data';
import { Users, Shield, Edit, Save, X, User, Plus, Loader, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newRole, setNewRole] = useState('');

    // Add User State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });

    // Delete State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getProfiles();
            // Filter to show only team members (exclude regular users)
            const teamMembers = data.filter(user => user.role !== 'user');
            setUsers(teamMembers);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setNewRole(user.role);
    };

    const handleSave = async (id) => {
        try {
            await updateProfile(id, { role: newRole });
            setEditingId(null);
            loadUsers(); // Refresh
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setNewRole('');
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteProfile(deleteId);
            setDeleteId(null);
            loadUsers();
        } catch (error) {
            console.error(error);
            alert(`Failed to delete user: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setAddUserLoading(true);

        try {
            // 1. Create a temporary client to sign up without affecting current session
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
                { auth: { persistSession: false } }
            );

            // 2. Sign Up
            const { data, error } = await tempSupabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        admin_created: true
                    }
                }
            });

            if (error) throw error;

            if (data?.user) {
                // 3. Update the role
                if (newUser.role !== 'user') {
                    // Poll for profile creation (wait up to 10s)
                    let profileExists = false;
                    for (let i = 0; i < 10; i++) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', data.user.id)
                            .single();

                        if (profile) {
                            profileExists = true;
                            break;
                        }
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    if (!profileExists) {
                        throw new Error("Profile creation timed out. The user was created but the profile is missing.");
                    }

                    // Update role
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ role: newUser.role })
                        .eq('id', data.user.id);

                    if (updateError) throw updateError;
                }

                alert(`User created successfully! ${data.session ? '' : '(Confirmation email sent)'}`);
                setShowAddModal(false);
                setNewUser({ email: '', password: '', role: 'user' });
                loadUsers();
            }

        } catch (error) {
            console.error("Error creating user:", error);
            alert(`Failed to create user: ${error.message}`);
        } finally {
            setAddUserLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-sage-900">User Management</h1>
                    <p className="text-stone-500 mt-1">Manage user roles and permissions.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-sage-900 text-white px-4 py-2 rounded-lg hover:bg-sage-800 transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Add New User
                </button>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-sage-900">Add New User</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                >
                                    <option value="user">User</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="seo_writer">SEO Writer</option>
                                    <option value="admin">Admin</option>
                                    <option value="agent">Agent</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-sage-200 text-sage-700 rounded-lg hover:bg-sage-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addUserLoading}
                                    className="flex-1 px-4 py-2 bg-sage-900 text-white rounded-lg hover:bg-sage-800 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {addUserLoading ? <Loader className="animate-spin w-4 h-4" /> : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-sage-900">Delete User?</h3>
                                <p className="text-stone-500 mt-1">This action cannot be undone. The user will be permanently removed.</p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 px-4 py-2 border border-sage-200 text-sage-700 rounded-lg hover:bg-sage-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isDeleting ? <Loader className="animate-spin w-4 h-4" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-sage-50 border-b border-sage-100 text-xs font-bold uppercase text-sage-600 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-50">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sage-900">{user.email || "No Email"}</p>
                                            <p className="text-xs text-stone-400 font-mono">{user.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === user.id ? (
                                        <select
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            className="px-2 py-1 border border-sage-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                                        >
                                            <option value="user">User</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="seo_writer">SEO Writer</option>
                                            <option value="admin">Admin</option>
                                            <option value="agent">Agent</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                            user.role === 'seo_writer' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                user.role === 'agent' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    'bg-stone-100 text-stone-600 border-stone-200'
                                            }`}>
                                            <Shield size={10} />
                                            {user.role || 'user'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingId === user.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleSave(user.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                                            <button onClick={handleCancel} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-stone-400 hover:text-sage-600 transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => confirmDelete(user.id)}
                                        className="ml-2 text-stone-400 hover:text-red-500 transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-stone-500">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManager;
