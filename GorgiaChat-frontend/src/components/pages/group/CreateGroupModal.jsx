import React, { useState } from "react";
import modalStyle from "../../../assets/css/Modal.module.css";
import defaultInstance from "../../../api/defaultInstance";
import { useSelector } from "react-redux";

const CreateGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const user = useSelector(state => state.auth.user);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUsers.length === 0) return;
        try {
            await defaultInstance.post('/user/group/create', {
                name: groupName,
                userIds: selectedUsers.map(u => u.id),
                creatorId: user.id
            });
        } catch (err) {
            // Optionally show error
        }
        onClose();
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearch(value);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await defaultInstance.get(`/user/search-user?q=${encodeURIComponent(value)}`);
            setSearchResults(res.data.users || []);
        } catch {
            setSearchResults([]);
        }
        setSearchLoading(false);
    };

    const handleToggleUser = (user) => {
        setSelectedUsers((prev) =>
            prev.some((u) => u.id === user.id)
                ? prev.filter((u) => u.id !== user.id)
                : [...prev, user]
        );
    };

    const isUserSelected = (user) => selectedUsers.some((u) => u.id === user.id);

    return (
        <div className={modalStyle.modalOverlay} onClick={onClose}>
            <div className={modalStyle.modalBox} onClick={e => e.stopPropagation()}>
                <button className={modalStyle.closeBtn} onClick={onClose} title="Close">&times;</button>
                <h2 style={{
                    marginBottom: 28,
                    fontWeight: 700,
                    fontSize: "1.45em",
                    letterSpacing: "0.01em",
                    color: "#fff",
                    textAlign: "center"
                }}>
                    Create a New Group
                </h2>
                {/* <div style={{
                    color: "#b6c2d6",
                    fontSize: "1em",
                    marginBottom: 24,
                    textAlign: "center"
                }}>
                    Give your group a unique name, add users and start chatting!
                </div> */}
                <form onSubmit={handleSubmit}>
                    <label className={modalStyle.modalLabel}>
                        Group name
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className={modalStyle.modalInput}
                            required
                            autoFocus
                        />
                    </label>
                    <div style={{ marginBottom: 18 }}>
                        <label className={modalStyle.modalLabel}>
                            Add users
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search users"
                                className={modalStyle.modalInput}
                                style={{ marginBottom: 8 }}
                            />
                        </label>
                        <div style={{
                            maxHeight: 140,
                            overflowY: "auto",
                            background: "#181e29",
                            borderRadius: 8,
                            border: "1px solid #232a34",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            marginBottom: 8
                        }}>
                            {searchLoading && (
                                <div style={{ color: "#888", padding: 12, textAlign: "center" }}>Searching...</div>
                            )}
                            {!searchLoading && search && searchResults.length === 0 && (
                                <div style={{ color: "#888", padding: 12, textAlign: "center" }}>No users found</div>
                            )}
                            {!searchLoading && searchResults.map(user => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "10px 14px",
                                        cursor: "pointer",
                                        background: isUserSelected(user) ? "#1a7fc1" : "transparent",
                                        color: "#fff",
                                        borderBottom: "1px solid #232a34",
                                        borderRadius: isUserSelected(user) ? 8 : 0,
                                        transition: "background 0.15s"
                                    }}
                                    onClick={() => handleToggleUser(user)}
                                >
                                    <span style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: "50%",
                                        background: "#0173b1",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        marginRight: 17,
                                        padding: "17px"
                                    }}>
                                        {user.username ? user.username[0].toUpperCase() : "?"}
                                    </span>
                                    <div style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column"
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{user.username}</span>
                                        <span style={{ color: "#aaa", fontSize: "0.95em" }}>{user.email}</span>
                                    </div>
                                    {isUserSelected(user) && (
                                        <span style={{
                                            marginLeft: 10,
                                            color: "#fff",
                                            fontSize: 18,
                                            background: "#0173b1",
                                            borderRadius: "50%",
                                            width: 22,
                                            height: 22,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            ✓
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {selectedUsers.length > 0 && (
                            <div style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 8
                            }}>
                                {selectedUsers.map(user => (
                                    <span
                                        key={user.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            background: "#fff",
                                            color: "#0173b1",
                                            borderRadius: 20,
                                            padding: "5px 10px 5px 10px",
                                            fontSize: 15,
                                            fontWeight: 500,
                                            boxShadow: "0 1px 4px rgba(1,115,177,0.10)",
                                            border: "1px solid #0173b1",
                                        }}
                                    >
                                        <span style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: "50%",
                                            background: "#0173b1",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                            fontSize: 15,
                                            marginRight: 7
                                        }}>
                                            {user.username ? user.username[0].toUpperCase() : "?"}
                                        </span>
                                        {user.username}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleUser(user)}
                                            style={{
                                                marginLeft: 6,
                                                background: "transparent",
                                                border: "none",
                                                color: "#0173b1",
                                                fontSize: 18,
                                                cursor: "pointer",
                                                lineHeight: 1,
                                                padding: 0
                                            }}
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className={modalStyle.modalSubmitBtn}
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                    >
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;