/*
 * Exports des statistiques : PDF (jspdf + jspdf-autotable) et Excel (exceljs).
 * Les bibliothèques sont chargées à la demande (import dynamique) : elles ne pèsent pas sur
 * le chargement de l'application.
 *
 * Format commun : { titre, sousTitre, sections: [{ titre, colonnes: string[], lignes: (string|number)[][] }] }
 */

function nomFichier(base, extension) {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${base}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.${extension}`
}

function telecharger(blob, nom) {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Les polices standard du PDF ne connaissent pas certains caractères typographiques
const pourPdf = (v) =>
  String(v ?? '')
    .replace(/[  ]/g, ' ')
    .replace(/[≥]/g, '>=')
    .replace(/[≤]/g, '<=')

export async function exporterPdf({ titre, sousTitre, sections }, base = 'statistiques-nbm') {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(pourPdf(titre), 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(106, 105, 100)
  doc.text(pourPdf(sousTitre), 14, 25)
  let y = 32
  for (const section of sections) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(17, 17, 17)
    if (y > 260) {
      doc.addPage()
      y = 18
    }
    doc.text(pourPdf(section.titre), 14, y)
    autoTable(doc, {
      startY: y + 3,
      head: [section.colonnes.map(pourPdf)],
      body: section.lignes.map((l) => l.map(pourPdf)),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [17, 17, 17], textColor: [244, 243, 239] },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 12
  }
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(138, 137, 132)
    doc.text(`NBM Stock · Nabeul Bois et Meubles · page ${i} / ${pages}`, 14, 290)
  }
  doc.save(nomFichier(base, 'pdf'))
}

export async function exporterExcel({ titre, sousTitre, sections }, base = 'statistiques-nbm') {
  const { default: ExcelJS } = await import('exceljs')
  const classeur = new ExcelJS.Workbook()
  classeur.creator = 'NBM Stock'
  classeur.created = new Date()
  for (const section of sections) {
    const feuille = classeur.addWorksheet(section.titre.slice(0, 31).replace(/[\\/*?:[\]]/g, ' '))
    feuille.addRow([titre]).font = { bold: true, size: 14 }
    feuille.addRow([sousTitre]).font = { color: { argb: 'FF6A6964' } }
    feuille.addRow([section.titre]).font = { bold: true, size: 12 }
    feuille.addRow([])
    const entete = feuille.addRow(section.colonnes)
    entete.font = { bold: true, color: { argb: 'FFF4F3EF' } }
    entete.eachCell((cellule) => {
      cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } }
    })
    for (const ligne of section.lignes) feuille.addRow(ligne)
    feuille.columns.forEach((colonne, i) => {
      const largeurs = [section.colonnes[i], ...section.lignes.map((l) => l[i])].map(
        (v) => String(v ?? '').length,
      )
      colonne.width = Math.min(48, Math.max(12, ...largeurs) + 2)
    })
  }
  const tampon = await classeur.xlsx.writeBuffer()
  telecharger(
    new Blob([tampon], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    nomFichier(base, 'xlsx'),
  )
}
