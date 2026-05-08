import Alpine from "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js";

import EditorJS from "https://esm.sh/@editorjs/editorjs";
import Header from "https://esm.sh/@editorjs/header";
import List from "https://esm.sh/@editorjs/list";
import ImageTool from "https://esm.sh/@editorjs/image";

import { supabase } from "./supabase.js";

window.Alpine = Alpine;

document.addEventListener("alpine:init", () => {
  Alpine.data("painelEditor", () => {
    // 💡 O SEGREDO ESTÁ AQUI:
    // Guardamos a instância fora do objeto reativo do Alpine!
    let editor = null;

    return {
      titulo: "",
      resumo: "",
      mensagem: "",
      carregando: false,

      async init() {
        // 1. Verificação de Segurança
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "login.html";
          return;
        }

        await this.$nextTick();

        // 2. Inicialização do Editor.js (Usamos 'editor' e não 'this.editor')
        editor = new EditorJS({
          holder: "editorjs",
          placeholder: "Comece a escrever o seu artigo aqui...",
          tools: {
            header: {
              class: Header,
            },
            list: {
              class: List,
            },

            image: {
              class: ImageTool,
              config: {
                uploader: {
                  async uploadByFile(file) {
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `artigos/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from("blog-imagens")
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage
                      .from("blog-imagens")
                      .getPublicUrl(filePath);

                    return {
                      success: 1,
                      file: { url: data.publicUrl },
                    };
                  },
                },
              },
            },
          },
        });
      },

      async guardarArtigo() {
        if (!this.titulo) {
          alert("O título é obrigatório!");
          return;
        }

        this.carregando = true;
        try {
          // Usamos a variável isolada 'editor'
          const conteudoJson = await editor.save();

          const slug = this.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");

          // Encontra a 1ª imagem para a capa (com navegação segura '?')
          const imagemCapa =
            conteudoJson.blocks.find((b) => b.type === "image")?.data?.file
              ?.url || "";

          const { error } = await supabase.from("artigos").insert([
            {
              titulo: this.titulo,
              resumo: this.resumo,
              conteudo: conteudoJson,
              slug: slug,
              imagem_capa: imagemCapa,
            },
          ]);

          if (error) throw error;

          this.mensagem = "✅ Artigo publicado com sucesso!";

          setTimeout(() => {
            this.titulo = "";
            this.resumo = "";
            editor.clear(); // Limpa o editor
            this.mensagem = "";
          }, 3000);
        } catch (err) {
          console.error(err);
          alert("Erro ao publicar: " + err.message);
        } finally {
          this.carregando = false;
        }
      },

      async fazerLogout() {
        await supabase.auth.signOut();
        window.location.href = "login.html";
      },
    };
  });
});

Alpine.start();
