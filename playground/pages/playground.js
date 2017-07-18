import Head from '../components/Head';
export default () =>
  <div>
    <style jsx>{`
      .columns {
        padding: 15px;
      }
    `}</style>
    <Head title="Source Playground" />
    <div className="columns">Playground</div>
    <div className="columns">
      <div className="col-8">
        <h1>Editor</h1>
      </div>
      <div className="col">
        <h1>Interpreter</h1>
      </div>
    </div>
  </div>;
