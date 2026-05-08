import Alpine from "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js";
import { supabase } from "./supabase.js";

Alpine.data("dashboardAdmin", () => ({
  artigos: [],

  async init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/admin/login.html";
      return;
    }

    await this.buscarArtigos();
  },

  async buscarArtigos() {
    const { data, error } = await supabase
      .from("artigos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    this.artigos = data;
  },

  async excluirArtigo(id) {
    const confirmar = confirm("Tem certeza que deseja excluir este artigo?");

    if (!confirmar) return;

    const { error } = await supabase.from("artigos").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir artigo");
      return;
    }

    this.artigos = this.artigos.filter((artigo) => artigo.id !== id);
  },

  async logout() {
    await supabase.auth.signOut();

    window.location.href = "/admin/login.html";
  },

  formatarData(dataIso) {
    return new Date(dataIso).toLocaleDateString("pt-BR");
  },
}));

window.Alpine = Alpine;
Alpine.start();
