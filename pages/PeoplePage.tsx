import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { db } from '../db';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import { Trash2Icon } from '../components/common/Icons';
import Card from '../components/common/Card';

const PeoplePage: React.FC = () => {
  const { group, groupMembers, loading } = useData();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !newMemberName.trim()) return;

    try {
      await db.members.add({
        groupId: group.id!,
        name: newMemberName.trim(),
      });
      setNewMemberName('');
      setAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('There was an error adding the member.');
    }
  };
  
  const handleDeleteMember = async (memberId: number) => {
      // Simple check for expenses involving the member
      const expenseCount = await db.expenses.where({ payerMemberId: memberId }).count();
      const allocationCount = await db.allocations.where({ memberId: memberId }).count();
      
      if (expenseCount > 0 || allocationCount > 0) {
          alert("Cannot delete a member who is part of an expense. Please settle up and delete related expenses first.");
          return;
      }
      
      if (window.confirm("Are you sure you want to delete this member? This cannot be undone.")) {
          try {
              await db.members.delete(memberId);
          } catch(error) {
              console.error("Failed to delete member", error);
              alert("There was an error deleting the member.");
          }
      }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Group Members</h1>
        <Button onClick={() => setAddModalOpen(true)}>Add Member</Button>
      </div>

      <Card>
        {groupMembers.length > 0 ? (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {groupMembers.map(member => (
              <li key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} />
                  <span className="font-medium text-slate-800 dark:text-slate-100">{member.name}</span>
                </div>
                <Button size="icon" variant="danger" onClick={() => handleDeleteMember(member.id!)}>
                    <Trash2Icon className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-8">No members in this group yet.</p>
        )}
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Member">
        <form onSubmit={handleAddMember} className="space-y-4">
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
    </div>
  );
};

export default PeoplePage;