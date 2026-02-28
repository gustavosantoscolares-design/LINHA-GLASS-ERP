
"use client";
import { useState } from "react";
import jsPDF from "jspdf";

export default function Home() {

  const [numeroOrcamento, setNumeroOrcamento] = useState("");

  const [cliente, setCliente] = useState({
    nome: "",
    cpf: "",
    endereco: "",
    cidade: "",
    telefone: "",
    data: ""
  });

  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [valorParcela, setValorParcela] = useState("");
  const [formaParcela, setFormaParcela] = useState("");

  const [items, setItems] = useState([
    { descricao: "", quantidade: 1, valorUnitario: 0, imagem: null }
  ]);

  const addItem = () => {
    setItems([...items, { descricao: "", quantidade: 1, valorUnitario: 0, imagem: null }]);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleImage = (index, file) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const newItems = [...items];
      newItems[index].imagem = reader.result;
      setItems(newItems);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const calcularTotalItem = (item) => {
    return item.quantidade * item.valorUnitario;
  };

  const calcularTotalGeral = () => {
    return items.reduce((total, item) => total + calcularTotalItem(item), 0);
  };

  const gerarPDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 10, 10);
    doc.text("CNPJ: 13.423.167/0001-07", 10, 16);
    doc.text("Telefone: (051) 99770-0701 / (051) 98952-5909", 10, 22);

    doc.text(`Orçamento Nº: ${numeroOrcamento}`, 140, 10);

    doc.text("Dados do Cliente:", 10, 35);
    doc.text(`Nome: ${cliente.nome}`, 10, 42);
    doc.text(`CPF/CNPJ: ${cliente.cpf}`, 10, 48);
    doc.text(`Endereço: ${cliente.endereco}`, 10, 54);
    doc.text(`Cidade: ${cliente.cidade}`, 10, 60);
    doc.text(`Telefone: ${cliente.telefone}`, 10, 66);
    doc.text(`Data: ${cliente.data}`, 10, 72);

    let y = 85;

    items.forEach((item, index) => {
      doc.text(`Item ${index + 1}: ${item.descricao}`, 10, y);
      y += 6;

      doc.text(`Qtd: ${item.quantidade}`, 10, y);
      doc.text(`Valor Unitário: R$ ${item.valorUnitario}`, 60, y);
      doc.text(`Total: R$ ${calcularTotalItem(item).toFixed(2)}`, 140, y);

      y += 8;

      if (item.imagem) {
        try {
          doc.addImage(item.imagem, undefined, 10, y, 40, 40);
          y += 45;
        } catch (error) {
          console.log("Erro ao adicionar imagem:", error);
        }
      } else {
        y += 5;
      }
    });

    doc.setFontSize(14);
    doc.text(`Total Geral: R$ ${calcularTotalGeral().toFixed(2)}`, 130, y + 10);

    y += 25;
    doc.setFontSize(12);
    doc.text("Condições de Pagamento:", 10, y);
    y += 6;

    if (formaPagamento === "avista") {
      doc.text("- Pagamento à vista", 10, y);
    } else if (formaPagamento === "parcelado") {
      doc.text(`- Pagamento parcelado em ${parcelas}x`, 10, y);
      y += 6;
      doc.text(`- Valor de cada parcela: R$ ${valorParcela}`, 10, y);
      y += 6;
      doc.text(`- Forma das parcelas: ${formaParcela}`, 10, y);
    } else if (formaPagamento === "meio") {
      doc.text("- 50% entrada / 50% instalação", 10, y);
    } else {
      doc.text("- Não informada", 10, y);
    }

    const pdfBlob = doc.output("blob");

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `Orcamento-${numeroOrcamento}.pdf`,
          types: [{
            description: 'Documento PDF',
            accept: { 'application/pdf': ['.pdf'] }
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
      } else {
        // Fallback for browsers that don't support showSaveFilePicker
        doc.save(`Orcamento-${numeroOrcamento}.pdf`);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao salvar o arquivo', error);
        alert('Erro ao tentar salvar o arquivo.');
      }
    }
  };

  const exportarBackup = async () => {
    const dados = {
      numeroOrcamento,
      cliente,
      formaPagamento,
      parcelas,
      valorParcela,
      formaParcela,
      items
    };
    const json = JSON.stringify(dados);
    const blob = new Blob([json], { type: "application/json" });

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `backup-orcamento-${numeroOrcamento || "sem-numero"}.json`,
          types: [{
            description: 'Arquivo JSON',
            accept: { 'application/json': ['.json'] }
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-orcamento-${numeroOrcamento || "sem-numero"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao exportar backup:', error);
        alert("Erro ao tentar salvar o backup.");
      }
    }
  };

  const importarBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        if (dados.numeroOrcamento !== undefined) setNumeroOrcamento(dados.numeroOrcamento);
        if (dados.cliente) setCliente(dados.cliente);
        if (dados.formaPagamento !== undefined) setFormaPagamento(dados.formaPagamento);
        if (dados.parcelas !== undefined) setParcelas(dados.parcelas);
        if (dados.valorParcela !== undefined) setValorParcela(dados.valorParcela);
        if (dados.formaParcela !== undefined) setFormaParcela(dados.formaParcela);
        if (dados.items) setItems(dados.items);
      } catch (error) {
        alert("Erro ao importar backup. Arquivo inválido.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Limpa a seleção para permitir selecionar o mesmo arquivo novamente
  };

  const gerarRecibo = async () => {
    const valorPago = window.prompt("Digite o valor que está sendo pago neste recibo:");
    if (!valorPago) return;

    const formaPgto = window.prompt("Digite a forma de pagamento (Ex: PIX, Dinheiro, Cartão):");
    if (!formaPgto) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RECIBO", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text("Emitente:", 10, 35);
    doc.setFontSize(10);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 10, 42);
    doc.setFontSize(12);
    doc.text("CNPJ: 13.423.167/0001-07", 10, 48);
    doc.text("Telefone: (051) 99770-0701 / (051) 98952-5909", 10, 54);

    doc.text(`Valor Recebido: R$ ${valorPago}`, 130, 35);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 130, 42);
    if (numeroOrcamento) {
      doc.text(`Ref. Orçamento: ${numeroOrcamento}`, 130, 48);
    }

    doc.text("Recebemos de:", 10, 70);
    doc.text(`Nome: ${cliente.nome}`, 10, 77);
    doc.text(`CPF/CNPJ: ${cliente.cpf}`, 10, 83);
    doc.text(`Endereço: ${cliente.endereco}`, 10, 89);
    doc.text(`Cidade: ${cliente.cidade}`, 10, 95);

    doc.text("Referente a:", 10, 110);
    let y = 117;
    items.forEach((item) => {
      if (item.descricao) {
        const linhas = doc.splitTextToSize(`- ${item.descricao}`, 190);
        doc.text(linhas, 10, y);
        y += linhas.length * 6;
      }
    });

    y += 10;
    doc.text(`Valor Total do Orçamento: R$ ${calcularTotalGeral().toFixed(2)}`, 10, y);
    y += 7;
    doc.text(`Forma de Pagamento Recebida: ${formaPgto}`, 10, y);

    y += 30;
    doc.text("____________________________________________________", 55, y);
    doc.text("LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA", 48, y + 6);

    const pdfBlob = doc.output("blob");

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `Recibo-${numeroOrcamento || cliente.nome || "Avulso"}.pdf`,
          types: [{
            description: 'Documento PDF',
            accept: { 'application/pdf': ['.pdf'] }
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
      } else {
        // Fallback
        doc.save(`Recibo-${numeroOrcamento || cliente.nome || "Avulso"}.pdf`);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao salvar o recibo', error);
        alert('Erro ao tentar salvar o recibo.');
      }
    }
  };

  return (
    <div className="container">

      <div className="empresa">
        <h2>LINHA GLASS - COMERCIO DE VIDROS E ESQUADRIAS LTDA</h2>
        <p>CNPJ: 13.423.167/0001-07</p>
        <p>Telefone: (051) 99770-0701 / (051) 98952-5909</p>
      </div>

      <div className="numero">
        <label>Nº Orçamento:</label>
        <input
          value={numeroOrcamento}
          onChange={(e) => setNumeroOrcamento(e.target.value)}
        />
      </div>

      <h3>Dados do Cliente</h3>

      <div className="cliente">
        <input placeholder="Nome" value={cliente.nome}
          onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />

        <input placeholder="CPF/CNPJ" value={cliente.cpf}
          onChange={(e) => setCliente({ ...cliente, cpf: e.target.value })} />

        <input placeholder="Endereço" value={cliente.endereco}
          onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })} />

        <input placeholder="Cidade" value={cliente.cidade}
          onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })} />

        <input placeholder="Telefone" value={cliente.telefone}
          onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} />

        <input type="date" value={cliente.data}
          onChange={(e) => setCliente({ ...cliente, data: e.target.value })} />
      </div>

      <h3>Itens</h3>

      {items.map((item, index) => (
        <div key={index} className="item-box">

          <textarea placeholder="Descrição"
            value={item.descricao}
            onChange={(e) => handleChange(index, "descricao", e.target.value)} />

          <input type="number" placeholder="Quantidade"
            value={item.quantidade}
            onChange={(e) => handleChange(index, "quantidade", Number(e.target.value))} />

          <input type="number" placeholder="Valor Unitário"
            value={item.valorUnitario}
            onChange={(e) => handleChange(index, "valorUnitario", Number(e.target.value))} />

          <input type="file" accept="image/*"
            onChange={(e) => handleImage(index, e.target.files[0])} />

          <div className="total-item">
            Total: R$ {calcularTotalItem(item).toFixed(2)}
          </div>

        </div>
      ))}

      <button onClick={addItem}>+ Adicionar Item</button>

      <div className="total-geral">
        Total Geral: R$ {calcularTotalGeral().toFixed(2)}
      </div>

      <div className="pagamento">
        <h3>Forma de Pagamento</h3>

        <select value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}>

          <option value="">Selecione</option>
          <option value="avista">Pagamento à vista</option>
          <option value="parcelado">Pagamento parcelado</option>
          <option value="meio">50% entrada / 50% instalação</option>
        </select>

        {formaPagamento === "parcelado" && (
          <div className="parcelado">
            <input type="number" max="3"
              placeholder="Qtd parcelas (máx 3)"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)} />

            <input placeholder="Forma das parcelas"
              value={formaParcela}
              onChange={(e) => setFormaParcela(e.target.value)} />

            <input placeholder="Valor de cada parcela"
              value={valorParcela}
              onChange={(e) => setValorParcela(e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
        <button onClick={gerarPDF} className="btn-pdf" style={{ flex: "1 1 auto" }}>
          Baixar Orçamento em PDF
        </button>

        <button onClick={gerarRecibo} className="btn-pdf" style={{ flex: "1 1 auto", backgroundColor: "#ffc107", color: "#000", borderColor: "#ffc107" }}>
          Gerar Recibo em PDF
        </button>

        <button onClick={exportarBackup} className="btn-pdf" style={{ flex: "1 1 auto", backgroundColor: "#007BFF", borderColor: "#007BFF" }}>
          Salvar Backup (.json)
        </button>

        <label className="btn-pdf" style={{ flex: "1 1 auto", backgroundColor: "#28a745", borderColor: "#28a745", cursor: "pointer", textAlign: "center", margin: 0, boxSizing: "border-box" }}>
          Carregar Backup (.json)
          <input type="file" accept=".json" onChange={importarBackup} style={{ display: "none" }} />
        </label>
      </div>

    </div>
  );
}
