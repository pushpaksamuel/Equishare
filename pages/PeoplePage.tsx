

import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { db } from '../db';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import { Trash2Icon } from '../components/common/Icons';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import type { Member, Group } from '../types';

const PeoplePage: React.FC = () => {
  // FIX: Destructure `groupTypeMembers` instead of `groupMembers` to align with the `useData` hook update.
  const { 
    groupTypeMembers,
    familyMembers,
    individualMembers,
    allGroups, 
    loading 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'group' | 'family' | 'individual'>('group');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberName.trim()) {
        alert("Please select a group and enter a name.");
        return;
    }

    try {
      await db.members.add({
        groupId: Number(selectedGroupId),
        name: newMemberName.trim(),
      });
      setNewMemberName('');
      setSelectedGroupId('');
      setAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('There was an error adding the member.');
    }
  };
  
  const openDeleteModal = async (member: Member) => {
      // Simple check for expenses involving the member
      const expenseCount = await db.expenses.where({ payerMemberId: member.id! }).count();
      const allocationCount = await db.allocations.where({ memberId: member.id! }).count();
      
      if (expenseCount > 0 || allocationCount > 0) {
          alert("Cannot delete a member who is part of an expense. Please settle up and delete related expenses first.");
          return;
      }
      
      setMemberToDelete(member);
      setDeleteModalOpen(true);
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
        await db.members.delete(memberToDelete.id!);
    } catch(error) {
        console.error("Failed to delete member", error);
        alert("There was an error deleting the member.");
    } finally {
        setMemberToDelete(null);
        setDeleteModalOpen(false);
    }
  };

  const renderMembers = (members: Member[]) => {
    if (members.length === 0) {
      return <p className="text-slate-500 text-center py-8">No members in this section yet.</p>;
    }
    return (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map(member => (
                <li key={member.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar name={member.name} />
                        <span className="font-medium text-slate-800 dark:text-slate-100">{member.name}</span>
                    </div>
                    <Button size="icon" variant="danger" onClick={() => openDeleteModal(member)}>
                        <Trash2Icon className="w-4 h-4" />
                    </Button>
                </li>
            ))}
        </ul>
    );
  };

  const membersByTab = {
    // FIX: Use `groupTypeMembers` for the 'group' tab.
    group: groupTypeMembers,
    family: familyMembers,
    individual: individualMembers,
  };

  if (loading) return <div>Loading...</div>;

  const tabButtonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1";
  const activeTabClasses = "bg-primary-600 text-white shadow";
  const inactiveTabClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">People</h1>
        <Button onClick={() => setAddModalOpen(true)}>Add Member</Button>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
        <button className={`${tabButtonClasses} ${activeTab === 'group' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('group')}>Group</button>
        <button className={`${tabButtonClasses} ${activeTab === 'family' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('family')}>Family</button>
        <button className={`${tabButtonClasses} ${activeTab === 'individual' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('individual')}>Individual</button>
      </div>

      <Card>
        {renderMembers(membersByTab[activeTab])}
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="groupSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Group</label>
            <Select id="groupSelect" value={selectedGroupId} onChange={e => setSelectedGroupId(Number(e.target.value))} required>
                <option value="" disabled>Choose a group...</option>
                {allGroups.map((group: Group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                ))}
            </Select>
          </div>
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Member Name</label>
            <Input id="memberName" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} required placeholder="Enter name" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete Member">
        <p className="text-slate-600 dark:text-slate-400 mb-6">
            Are you sure you want to delete <span className="font-bold">{memberToDelete?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={confirmDeleteMember}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PeoplePage;