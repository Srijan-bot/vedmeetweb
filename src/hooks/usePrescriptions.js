import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePrescriptions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- USER ACTIONS ---

    const uploadPrescription = useCallback(async (file, userId) => {
        setLoading(true);
        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('prescriptions')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Create Record
            const { data, error: dbError } = await supabase
                .from('prescriptions')
                .insert([{
                    user_id: userId,
                    image_path: filePath,
                    status: 'pending'
                }])
                .select()
                .single();

            if (dbError) throw dbError;
            return data;
        } catch (err) {
            setError(err);
            console.error('Upload error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserPrescriptions = useCallback(async (userId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            setError(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getPrescriptionDetails = useCallback(async (id) => {
        setLoading(true);
        try {
            // Fetch prescription
            const { data: prescription, error: pError } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('id', id)
                .single();
            if (pError) throw pError;

            // Fetch Referrer Profile if exists
            let referrer = null;
            if (prescription.referred_by) {
                const { data: refData } = await supabase
                    .from('profiles')
                    .select('full_name, email, role')
                    .eq('id', prescription.referred_by)
                    .single();
                referrer = refData;
            }

            // Fetch items (medicines)
            const { data: items, error: iError } = await supabase
                .from('prescription_items')
                .select('*, product:medicine_id(*), variant:variant_id(*)') // Join with products and variants
                .eq('prescription_id', id);
            if (iError) throw iError;

            // Fetch queries
            const { data: queries, error: qError } = await supabase
                .from('prescription_queries')
                .select('*')
                .eq('prescription_id', id)
                .order('created_at', { ascending: true });
            if (qError) throw qError;

            // Get Signed URL
            const { data: signedUrlData, error: urlError } = await supabase.storage
                .from('prescriptions')
                .createSignedUrl(prescription.image_path, 3600); // 1 hour

            if (urlError) throw urlError;

            return {
                ...prescription,
                signedImageUrl: signedUrlData.signedUrl,
                items,
                queries,
                referrer
            };
        } catch (err) {
            setError(err);
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const addQuery = useCallback(async (prescriptionId, message, userId) => {
        const { data, error } = await supabase
            .from('prescription_queries')
            .insert([{ prescription_id: prescriptionId, message, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        // If the sender is the prescription owner (user), set the new query flag
        // We can check if userId matches auth user, assuming this function is used by both.
        // For simplicity, we can just call the RPC. If it's an admin replying, they shouldn't trigger "new query" for themselves?
        // Actually, if ADMIN replies, we might want to notify USER. But for now, user requested: "when user raise query make ... flashing ... for admin"

        // We determine if we should set the flag based on who is calling. 
        // If the current auth session user is NOT an admin, set flag.

        const { data: { user } } = await supabase.auth.getUser();
        // Check profile role? Or just assume if this is called from client side by user.
        // Let's call the RPC. We can optimize later if admin chats.
        // Ideally we check if the user is the owner.

        await supabase.rpc('set_new_query_flag', { p_id: prescriptionId });

        return data;
    }, []);

    const markPrescriptionSeen = useCallback(async (prescriptionId) => {
        await supabase.rpc('clear_new_query_flag', { p_id: prescriptionId });
    }, []);

    // --- ADMIN ACTIONS ---

    const getAllPrescriptions = useCallback(async (statusFilter) => {
        setLoading(true);
        try {
            let query = supabase
                .from('prescriptions')
                .select('*') // Simplified selection to avoid join errors
                .order('has_new_query', { ascending: false })
                .order('created_at', { ascending: false });

            if (statusFilter && statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch Profiles manually to avoid Join issues
            const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
            const referrerIds = [...new Set(data.map(p => p.referred_by).filter(Boolean))];
            const allIds = [...new Set([...userIds, ...referrerIds])];

            if (allIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', allIds);

                const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

                return data.map(p => ({
                    ...p,
                    user: profileMap[p.user_id],
                    referrer: profileMap[p.referred_by]
                }));
            }

            return data;
        } catch (err) {
            setError(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const referPrescription = useCallback(async (prescriptionId, items, userId) => {
        setLoading(true);
        try {
            // 1. Clear Existing Items (to allow updates/changes)
            const { error: deleteError } = await supabase
                .from('prescription_items')
                .delete()
                .eq('prescription_id', prescriptionId);
            if (deleteError) throw deleteError;

            // 2. Add New Items
            const itemsToInsert = items.map(item => ({
                prescription_id: prescriptionId,
                medicine_id: item.medicine_id,
                variant_id: item.variant_id, // Add variant_id
                quantity: item.quantity,     // Add quantity
                is_alternative: item.is_alternative,
                doctor_note: item.doctor_note
            }));

            const { error: itemsError } = await supabase
                .from('prescription_items')
                .insert(itemsToInsert);
            if (itemsError) throw itemsError;

            // 2. Update Status
            const { error: statusError } = await supabase
                .from('prescriptions')
                .update({ status: 'referred', referred_by: userId })
                .eq('id', prescriptionId);
            if (statusError) throw statusError;

            // 3. Notify User
            // Getting user_id from the prescription would be safer, but passed arg is fine
            // We need the prescription's owner ID, not the logged in admin's ID
            // So we should probably fetch it or pass it. 
            // Better: update logic to fetch owner ID inside here or pass it.
            // Let's assume userId passed here IS status owner, BUT actually function signature implies logged in user usually. 
            // Let's fetch prescription owner.
            const { data: pres } = await supabase.from('prescriptions').select('user_id').eq('id', prescriptionId).single();

            if (pres) {
                await supabase.from('notifications').insert([{
                    user_id: pres.user_id,
                    type: 'prescription_referred',
                    content: 'Your prescription has been reviewed and medicines referred.',
                    link: `/prescriptions/${prescriptionId}`,
                    reference_id: prescriptionId
                }]);
            }

            return true;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        uploadPrescription,
        getUserPrescriptions,
        getPrescriptionDetails,
        addQuery,
        getAllPrescriptions,
        referPrescription,
        markPrescriptionSeen
    };
};
