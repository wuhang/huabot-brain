var Navbar = ReactBootstrap.Navbar;
var Nav = ReactBootstrap.Nav;
var NavItemLink = ReactRouterBootstrap.NavItemLink;
var ButtonLink = ReactRouterBootstrap.ButtonLink;
var ModalTrigger = ReactBootstrap.ModalTrigger;
var Modal = ReactBootstrap.Modal;
var Button = ReactBootstrap.Button;
var Input = ReactBootstrap.Input;
var Grid = ReactBootstrap.Grid;
var Row = ReactBootstrap.Row;
var Col = ReactBootstrap.Col;
var ListGroup = ReactBootstrap.ListGroup;
var ListGroupItem = ReactBootstrap.ListGroupItem;
var Table = ReactBootstrap.Table;
var State = ReactRouter.State;
var Navigation = ReactRouter.Navigation;
var RouteHandler = ReactRouter.RouteHandler;
var Route = ReactRouter.Route;
var Router = ReactRouter.Router;
var Link = ReactRouter.Link;
var DefaultRoute = ReactRouter.DefaultRoute;
var NotFoundRoute = ReactRouter.NotFoundRoute;

var Dataset = React.createClass({
  render: function() {
    var dataset = this.props.data;
    return (
      <Modal {...this.props} title="View" animation={false}>
        <div className="modal-body">
          <div className="img" data-id={dataset.dataset_id}>
            <div className="dataset">
              <img src={"/upload/" + dataset.file.key} />
              <div className="tag">{dataset.tag.name}</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button onClick={this.props.onRequestHide}>Close</Button>
        </div>
      </Modal>
    )
  }
});


var Datasets = React.createClass({
  mixins: [State],

  waterfall: function() {
    if (this.cache.datasets.length === 0) {
      return;
    }
    jQuery("#waterfall").waterfall({
      selector: ".dataset",
    });
  },

  loadDatasets: function() {
    var self = this;
    var query = this.getQuery();
    var params = this.getParams();
    var max = query.max || '';
    var limit = Number(query.limit) || 50;
    var tag = query.tag || '';
    this.limit = limit;
    var dataType = params.dataType || 'all';
    jQuery.get('/api/datasets/?max=' + max + '&limit=' + limit + '&data_type=' + dataType + '&tag=' + tag, function(data) {
      self.setState(data);
    });
  },

  getInitialState: function() {
    this.cache = this.cache || {};
    return {datasets: []};
  },

  shouldLoadDatasets: function() {
    var path = this.getPath();
    if (this.cache.path !== path) {
      this.cache.path = path;
      return true;
    }
    return false;
  },

  shouldCleanDatasets: function() {
    var pathname = this.getPathname();
    var query = this.getQuery();
    if (this.cache.pathname !== pathname || this.cache.tag !== query.tag || !query.max) {
      this.cache.pathname = pathname;
      this.cache.tag = query.tag;
      this.cache.scroll = true;
      return true;
    }
    return false;
  },

  cleanDatasets: function() {
    this.cache.datasets = [];
  },

  componentDidMount: function() {
    this.cache.datasets = this.cache.datasets || [];
    this.componentDidUpdate();
  },

  componentDidUpdate: function() {
    if (this.shouldLoadDatasets()) {
      if (this.shouldCleanDatasets()) {
        this.cleanDatasets();
      }
      this.loadDatasets();
    } else {
      if (this.cache.scroll) {
        this.cache.scroll = false;
        window.scroll(0, 0);
      }
      this.waterfall();
    }
  },

  render: function() {
    var datasets = this.state.datasets || [];
    var loadMore;
    if (datasets.length >= this.limit) {
      var query = this.getQuery();
      query = query || {};
      query.max = datasets[datasets.length - 1].dataset_id;
      loadMore = (
        <div className="load-more">
          <ButtonLink bsStyle="info" bsSize="large"
              params={this.getParams()} to="datasets" query={query} block>加载更多...</ButtonLink>
        </div>
      );
    }
    if (this.cache.datasets && this.cache.datasets.length > 0) {
      var oldLastDataset = this.cache.datasets[this.cache.datasets.length - 1];
      var lastDataset = datasets[datasets.length - 1];
      if (oldLastDataset.dataset_id !== lastDataset.dataset_id) {
        this.cache.datasets = this.cache.datasets.concat(datasets);
      }
    } else {
      this.cache.datasets = datasets;
    }
    var elems = this.cache.datasets.map(function(dataset) {
      var width = 192;
      var height = width / dataset.file.width * dataset.file.height;
      if (height > 600) {
        height = 600;
      }
      return (
        <ModalTrigger modal={<Dataset data={dataset} title={dataset.tag.name} />}>
          <div className="dataset" data-id={dataset.dataset_id}>
            <div className="file" style={{width: width, height: height}}>
              <img src={"/upload/" + dataset.file.key} />
            </div>
            <div className="tag">{dataset.tag.name}</div>
          </div>
        </ModalTrigger>
      );
    });
    return (
      <div className="datasets">
        <div id="waterfall">
          {elems}
        </div>
        {loadMore}
      </div>
    );
  }
});

var SearchForm = React.createClass({
  getInitialState: function() {
    return {
      value: '',
      tags: []
    };
  },

  getHint: function(word) {
    var self = this;
    jQuery.get('/api/tags/hint?word=' + word, function(data) {
      self.setState(data);
    });
  },

  handleChange: function() {
    this.getHint(this.refs.tag.getValue());
    this.setState({
      value: this.refs.tag.getValue()
    });
  },

  handleSubmit: function(evt) {
    evt.preventDefault();
    this.props.onSubmit(this.state.value);
  },

  handleListClick: function(eventKey, href, target) {
    this.props.onSubmit(target);
    this.setState({tags: [], value: target});
  },

  render: function() {
    var list = this.state.tags.map(function(tag) {
      return <ListGroupItem target={tag.name}> {tag.name}</ListGroupItem>;
    });
    return (
      <form className="navbar-form navbar-right" onSubmit={this.handleSubmit}>
        <Input type="text"
          name="tag"
          value={this.state.value}
          ref="tag"
          placeholder="Search..."
          onChange={this.handleChange} />

        <div className="hint">
          <ListGroup onClick={this.handleListClick}>
            {list}
          </ListGroup>
        </div>
      </form>
    );
  }
});

var App = React.createClass({
  mixins: [State, Navigation],

  getInitialState: function() {
    return {href: window.location.href};
  },

  handleSubmit: function(tag) {
    var query = this.getQuery();
    query.tag = tag;
    var href = this.makeHref('datasets', this.getParams(), query);
    window.location.href = href;
    this.setState({href: href});
  },
  render: function() {
    return (
      <div className="app-main">
        <Navbar fixedTop inverse fluid brand="Caffe Learn">
          <Nav right>
            <NavItemLink to="dashboard">Dashboard</NavItemLink>
          </Nav>
          <SearchForm onSubmit={this.handleSubmit} />
        </Navbar>
        <Grid fluid>
          <Row>
            <Col sm={3} md={2} className="sidebar">
              <Nav>
                <NavItemLink to="datasets" params={{dataType: 'all'}}>所有数据</NavItemLink>
                <NavItemLink to="datasets" params={{dataType: 'train'}}>训练数据</NavItemLink>
                <NavItemLink to="datasets" params={{dataType: 'val'}}>验证数据</NavItemLink>
              </Nav>
            </Col>
            <Col sm={9} smOffset={3} md={10} mdOffset={2}>
              <RouteHandler />
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
});

var Dashboard = React.createClass({
  mixins: [State],

  loadTags: function() {
    var self = this;
    var query = this.getQuery();
    var max = query.max || '';
    var limit = Number(query.limit) || 20;
    this.limit = limit;
    jQuery.get('/api/tags/?max=' + max + '&limit=' + limit, function(data) {
      self.setState(data);
    });

  },

  getInitialState: function() {
    this.cache = this.cache || {};
    return {tags: []};
  },

  shouldLoadTags: function() {
    var path = this.getPath();
    if (this.cache.path !== path) {
      this.cache.path = path;
      return true;
    }
    return false;
  },

  shouldCleanTags: function() {
    console.log(this.getQuery());
    if (!this.getQuery().max) {
      return true;
    }
    return false;
  },

  cleanTags: function() {
    this.cache.tags = [];
  },

  componentDidMount: function() {
    this.cache.tags = this.cache.tags || [];
    this.componentDidUpdate();
  },

  componentDidUpdate: function() {
    if (this.shouldLoadTags()) {
      this.loadTags();
    } else {
      if (this.cache.scroll) {
        this.cache.scroll = false;
        window.scroll(0, 0);
      }
    }
  },

  render: function() {
    var tags = this.state.tags || [];
    var loadMore;
    if (tags.length >= this.limit) {
      var query = this.getQuery();
      query = query || {};
      query.max = tags[tags.length - 1].tag_id;
      loadMore = (
        <div className="load-more">
          <ButtonLink bsStyle="info" bsSize="large"
              params={this.getParams()} to="dashboard" query={query} block>加载更多...</ButtonLink>
        </div>
      );
    }
    if (this.cache.tags && this.cache.tags.length > 0) {
      var oldLastTag = this.cache.tags[this.cache.tags.length - 1];
      var lastTag = tags[tags.length - 1];
      if (oldLastTag.tag_id !== lastTag.tag_id) {
        this.cache.tags = this.cache.tags.concat(tags);
      }
    } else {
      this.cache.tags = tags;
    }
    var elems = this.cache.tags.map(function(tag) {
      return (
        <tr>
          <td>{tag.tag_id}</td>
          <td><Link to="datasets" params={{dataType: 'all'}} query={{tag: tag.name}}>{tag.name}</Link></td>
          <td>{tag.train_count}</td>
          <td>{tag.test_count}</td>
        </tr>
      );
    });
    return (
      <div className="dashboard">
        <h1 className="page-header"> Dashboard </h1>
        <Row className="train-status">
          <Col xs={6}>
            <img src="/static/imgs/acc.png" />
          </Col>
          <Col xs={6}>
            <img src="/static/imgs/acc.png" />
          </Col>
        </Row>
        <h2 class="sub-header">Tags</h2>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Train</th>
              <th>Test</th>
            </tr>
          </thead>
          <tbody>
            {elems}
          </tbody>
        </Table>
        {loadMore}
      </div>
    );
  }
});

var routes = (
  <Route handler={App} path="/">
    <DefaultRoute handler={Dashboard} />
    <Route name="dashboard" handler={Dashboard} />
    <Route name="datasets" handler={Datasets} path="/ds/:dataType"/>
    <NotFoundRoute handler={Datasets} />
  </Route>
);

ReactRouter.run(routes, function (Handler, state) {
  React.render(<Handler />, document.body);
});
