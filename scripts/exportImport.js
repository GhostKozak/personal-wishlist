import { AppState } from './state.js';
import { updateWishlist } from './wishlist.js';
import { createToast } from './toast.js';

export const exportJSON = () => {
  if (AppState.wishlist.length === 0) return createToast({type: 'info', message: 'No data to export!' });
  
  const jsonString = JSON.stringify(AppState.wishlist, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wishlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export const exportCSV = () => {
  if (AppState.wishlist.length === 0) return createToast({ type: 'info', message: 'No data to export!' });

  const headers = Array.from(new Set(AppState.wishlist.flatMap(item => Object.keys(item))));

  const formatCell = value => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.join(",");

  const dataRows = AppState.wishlist.map(item => headers.map(header => formatCell(item[header])).join(","));
  
  const csvData = [headerRow, ...dataRows].join("\n");
  // return [headerRow, ...dataRows].join("\n");

  const bom = "\uFEFF"; // for Turkish Characters
  const blob = new Blob([bom + csvData], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wishlist-backup-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

const importJSON = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      if (Array.isArray(importedData)) {
        updateWishlist(importedData);
        createToast({
          type: 'success',
          message: 'Data successfully loaded! 🎉'
        });

      } else {
        createToast({
          type: 'error',
          message: 'Invalid file format!'
        });
      }
    } catch (err) {
      createToast({
          type: 'error',
          message: 'Could not read JSON file!'
        });
    }
  }

  reader.readAsText(file);
}

const importCSV = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = e.target.result;

      // Clean BOM
      const cleanedData = importedData.replace(/^\uFEFF/, '');

      const rows = cleanedData
        .split(/\r?\n/)
        .filter(row => row.trim() !== '');

      if (rows.length === 0) {
        createToast({ type: 'error', message: 'CSV file is empty!' });
        return;
      }
      
      const productRows = rows.map(row => 
        row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(cell => 
            cell.trim()
              .replace(/^"|"$/g, '')
              .replace(/""/g, '"')
          )
      );

      const headers = productRows[0];
      const products = productRows.slice(1);

      const formattedProducts = products.map(product => {
        return Object.fromEntries(
          headers.map((header,index) => [header, product[index]])
        )
      })

      updateWishlist(formattedProducts);
      createToast({
        type: 'success',
        message: 'Data successfully loaded! 🎉'
      });

    } catch (error) {
      createToast({
        type: 'error',
        message: `Could not read CSV file! ${error}`
      });
    }
  }

  reader.readAsText(file);
}

export const importFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  switch (file.type) {
    case 'application/json':
      importJSON(file);
      break;
    case 'text/csv':
      importCSV(file);
      break;
    default:
      break;
  }

  console.log(file);
  event.target.value = '';
}