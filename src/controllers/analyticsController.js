const os = require('os');
const { Parser } = require('json2csv');
const objectMeta = require('../models/objectMeta');
const ActivityLog = require('../models/activityLog');

// Storage Analytics 

const StorageAnalytics = async (req, res) => {
    try {
      const stats = await objectMeta.aggregate([
        { $match: { owner: req.user._id } },
        {
          $group: {
            _id: '$folder',
            totalSizeBytes: { $sum: '$size' },
            fileCount: { $sum: 1 }
          }
        },
        {
          $addFields: {
            totalSizeMB: {
              $round: [{ $divide: ['$totalSizeBytes', 1024 * 1024] }, 2]
            }
          }
        }
      ]);
  
      console.log(`Storage Analytics for User ${req.user._id}`);
      stats.forEach(folder => {
        console.log(`${folder._id || 'Root'} — ${folder.fileCount} files — ${folder.totalSizeMB} MB`);
      });
      return res.status(200).json({
        message: "Storage stats",
        stats
      });
    } catch (error) {
      console.error("Error fetching storage analytics:", error);
      return res.status(500).json({
        message: "Failed to retrieve analytics"
      });
    }
  };

// User activity Metrics 

const UserMetrics = async(req,res)=>{
    try{ 
        const logs = await ActivityLog.find({
            user:req.user._id,
        }).sort({timestamp:-1}).limit(100);
    
        const uploadCount = logs.filter(log => log.action ==='upload').length;
        const downloadCount = logs.filter(log => log.action ==='download').length;
        const deleteCount = logs.filter(log => log.action ==='delete').length;
        const shareCount = logs.filter(log => log.action ==='share').length;
        const totalDownloads = logs.filter(log => log.action ==='download').reduce((total,log)=>total+log.size,0);

        return res.status(200).json({
            uploadCount,
            downloadCount,
            deleteCount,
            shareCount,
            totalDownloads,
            logs
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Failed to retrieve analytics"});
    }
};


const PerformaceMetrics = async(req,res)=>{
    try{ 
        const uptime = os.uptime();
        const load  = os.loadavg();
        const memoryUsage = process.memoryUsage();

        return res.status(200).json({
            message:{
                "uptime" : uptime,
                "load":load,
                "memoryUsage":{
                    total:os.totalmem(),
                    free:os.freemem(),
                    used:os.totalmem() - os.freemem(),
                    rss :memoryUsage.rss
                }
            }
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Failed to retrieve analytics"});
    }
};



const exportUsageReport = async (req, res) => {
    try {
      const data = await objectMeta.find({ owner: req.user._id }).select('filename size folder createdAt -_id').lean();
      const fields = ['filename', 'size', 'folder', 'createdAt'];
  
      const htmlTable = `
        <table border="1" cellspacing="0" cellpadding="5">
          <thead>
            <tr>${fields.map(f => `<th>${f}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row =>
              `<tr>${fields.map(f => `<td>${row[f]}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      `;
  
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlTable);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to export table' });
    }
  };

module.exports = {
    StorageAnalytics,
    UserMetrics,
    PerformaceMetrics,
    exportUsageReport
}




