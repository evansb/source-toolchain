export default () =>
  <footer className="Footer">
    <style jsx>{`
      footer {
        margin: 0 auto;
        background-color: black;
        padding: 75px 50px 50px;
        color: #cccccc;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0 0 10px;
      }
      li {
        display: inline;
        font-weight: 700;
        margin-right: 5px;
      }
      li:after {
        content: '.';
      }
      li a {
        color: white;
      }
    `}</style>
    <div className="container">
      <ul>
        <li>
          <a href="https://source-academy.comp.nus.edu.sg/">Source Academy</a>
        </li>
        <li><a href="https://comp.nus.edu.sg">NUS School of Computing</a></li>
      </ul>
      <div>&copy; 2017 - Source Academy Team</div>
      <div>Illustrations by Ng Tse Pei</div>
    </div>
  </footer>
