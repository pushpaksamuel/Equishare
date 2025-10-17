
import { db } from '../db';

export const exportData = async () => {
  try {
    const dataToExport = {
      groups: await db.groups.toArray(),
      members: await db.members.toArray(),
      categories: await db.categories.toArray(),
      expenses: await db.expenses.toArray(),
      allocations: await db.allocations.toArray(),
      settings: await db.settings.toArray(),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `equishare-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');

  } catch (error) {
    console.error('Failed to export data:', error);
    alert('Error exporting data. Check console for details.');
  }
};

export const importData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'application/json') {
      alert('Please select a valid JSON file.');
      return reject(new Error('Invalid file type'));
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        if (!data.groups || !data.members || !data.expenses) {
          throw new Error('Invalid backup file format.');
        }

        await db.transaction('rw', db.tables, async () => {
          // Clear existing data
          for (const table of db.tables) {
            await table.clear();
          }

          // Import new data
          await db.groups.bulkAdd(data.groups);
          await db.members.bulkAdd(data.members);
          await db.categories.bulkAdd(data.categories);
          await db.expenses.bulkAdd(data.expenses);
          await db.allocations.bulkAdd(data.allocations);
          await db.settings.bulkAdd(data.settings);
        });

        alert('Data imported successfully! The app will now reload.');
        window.location.reload();
        resolve();
      } catch (error) {
        console.error('Failed to import data:', error);
        alert(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};
