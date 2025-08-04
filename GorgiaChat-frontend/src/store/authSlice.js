import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('authToken');
const user = localStorage.getItem('authUser');

const initialState = {
    user: user ? JSON.parse(user) : null,
    token: token || null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            localStorage.setItem('authToken', action.payload.token);
            localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        },
        logout(state) {
            state.user = null;
            state.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        },
    },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
