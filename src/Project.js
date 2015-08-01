function Project(directory, info) {
    this.directory = directory;
    this.info = info;
}

Project.prototype.getLatestBuild = function() {
    return this.info.builds.length == 0 ? null : this.info.builds.sort(function (o1, o2) {
        if (o1.date > o2.date) {
            return -1;
        } else if (o2.date > o1.date) {
            return 1;
        }
        return 0;
    })[0];
};

module.exports = Project;
