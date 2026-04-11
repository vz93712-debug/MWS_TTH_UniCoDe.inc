import { GlobalLayout } from "./components/layouts/GlobalLayout";
import Editor from "./features/editor/Editor";

function App() {
  return (
    <GlobalLayout>
      {/* Центрируем редактор и задаем ему ширину, как в Notion */}
      <div className="max-w-[900px] mx-auto w-full py-10 px-8 h-full">
        <Editor />
      </div>
    </GlobalLayout>
  );
}

export default App;
